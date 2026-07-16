import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAllPublications,
  getDuplicatePublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
  getAllResearchProjects,
  getResearchProjectBySlug,
  getResearchProjectById,
  createResearchProject,
  updateResearchProject,
  deleteResearchProject,
  getAllNewsPosts,
  getNewsPostById,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
  createContactMessage,
  getAllContactMessages,
  markContactMessageRead,
} from "./db";
import { storagePut } from "./storage";
import { formatCitations, CitationStyle } from "./citationFormatter";
import { nanoid } from "nanoid";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── DOI Lookup via CrossRef ──────────────────────────────────────────────────
async function lookupDOI(doi: string) {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, "").trim();
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SEEDER-Website/1.0 (mailto:kelvin.xy.fong@nus.edu.sg)" },
  });
  if (!res.ok) throw new Error(`CrossRef lookup failed: ${res.status}`);
  const data = await res.json() as any;
  const work = data.message;

  const authors = (work.author || [])
    .map((a: any) => `${a.given ?? ""} ${a.family ?? ""}`.trim())
    .join(", ");

  const dateArr = work["published-print"]?.["date-parts"]?.[0]
    ?? work["published-online"]?.["date-parts"]?.[0]
    ?? work["created"]?.["date-parts"]?.[0];

  const year = dateArr?.[0] ?? null;
  const month = dateArr?.[1];
  const day = dateArr?.[2];
  const publicationDate = dateArr
    ? [year, month?.toString().padStart(2, "0"), day?.toString().padStart(2, "0")]
        .filter(Boolean)
        .join("-")
    : null;

  const journal =
    work["container-title"]?.[0] ??
    work["short-container-title"]?.[0] ??
    work.publisher ??
    null;

  const pages = work.page ?? work["article-number"] ?? null;
  const title = work.title?.[0] ?? "";
  const abstract = work.abstract ?? null;
  const link = `https://doi.org/${cleanDoi}`;

  return { title, authors, year, publicationDate, journal, pages, doi: cleanDoi, link, abstract };
}

// ─── BibTeX class → pubType mapping ─────────────────────────────────────────
const BIBTEX_CLASS_MAP: Record<string, string> = {
  article: "journal",
  inproceedings: "conference",
  proceedings: "conference",
  conference: "conference",
  book: "book",
  incollection: "book-chapter",
  inbook: "book-chapter",
  phdthesis: "thesis",
  mastersthesis: "thesis",
  techreport: "technical-report",
  misc: "other",
  unpublished: "preprint",
  patent: "patent",
  online: "other",
  electronic: "other",
  manual: "other",
  booklet: "other",
};

// ─── BibTeX Parser ────────────────────────────────────────────────────────────
function parseSingleBibtex(bibtex: string): {
  title: string; authors: string; year: number | null; publicationDate: string | null;
  journal: string | null; pages: string | null; doi: string | null; link: string | null;
  abstract: string | null; pubType: string; bibtexClass: string;
} {
  // Extract entry type (e.g. @article, @inproceedings)
  const typeMatch = bibtex.match(/@(\w+)\s*\{/);
  const bibtexClass = (typeMatch?.[1] ?? "misc").toLowerCase();
  const pubType = BIBTEX_CLASS_MAP[bibtexClass] ?? "other";

  // Parse fields — handle multi-line values by splitting on field boundaries
  const fields: Record<string, string> = {};
  // Replace newlines with spaces so we can use a simple non-dotall regex
  const flatBibtex = bibtex.replace(/[\r\n]+/g, " ");
  const fieldRegex = /(\w+)\s*=\s*[{"](.*?)[}"]/g;
  let match;
  while ((match = fieldRegex.exec(flatBibtex)) !== null) {
    fields[match[1].toLowerCase()] = match[2].replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  }

  const authors = fields.author
    ? fields.author.split(/ and /i).map((a) => a.trim()).join(", ")
    : "";
  const year = fields.year ? parseInt(fields.year) : null;
  const journal = fields.journal ?? fields.booktitle ?? fields.school ?? fields.institution ?? fields.publisher ?? null;
  const pages = fields.pages ?? fields.articlenumber ?? fields.number ?? null;
  const doi = fields.doi ?? null;
  const title = fields.title ?? "";
  const link = doi ? `https://doi.org/${doi}` : fields.url ?? null;

  return { title, authors, year, publicationDate: year?.toString() ?? null, journal, pages, doi, link, abstract: fields.abstract ?? null, pubType, bibtexClass };
}

// Parse a .bib file that may contain multiple entries
function parseMultipleBibtex(bibContent: string): ReturnType<typeof parseSingleBibtex>[] {
  // Split on @ entry boundaries (non-dotall: replace newlines first)
  const flatContent = bibContent.replace(/\r\n/g, "\n");
  const entryRegex = /@\w+\s*\{[^@]*/g;
  const entries: ReturnType<typeof parseSingleBibtex>[] = [];
  let match;
  while ((match = entryRegex.exec(flatContent)) !== null) {
    try {
      const parsed = parseSingleBibtex(match[0]);
      if (parsed.title) entries.push(parsed);
    } catch {
      // skip malformed entries
    }
  }
  return entries;
}

// Keep backward-compatible wrapper
function parseBibtex(bibtex: string) {
  return parseSingleBibtex(bibtex);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Team Members ───────────────────────────────────────────────────────────
  team: router({
    list: publicProcedure
      .input(z.object({ isAlumni: z.boolean().default(false) }))
      .query(({ input }) => getAllTeamMembers(input.isAlumni)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getTeamMemberById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          title: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          category: z.string().min(1),
          role: z.string().optional(),
          isAlumni: z.boolean().default(false),
          photoUrl: z.string().optional(),
          biography: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          researchInterests: z.string().optional(),
          displayOrder: z.number().default(0),
        })
      )
      .mutation(({ input }) => createTeamMember(input)),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          title: z.string().optional().nullable(),
          firstName: z.string().optional().nullable(),
          lastName: z.string().optional().nullable(),
          category: z.string().optional(),
          role: z.string().optional().nullable(),
          isAlumni: z.boolean().optional(),
          photoUrl: z.string().optional().nullable(),
          biography: z.string().optional(),
          email: z.string().optional().nullable(),
          researchInterests: z.string().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateTeamMember(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTeamMember(input.id)),

    uploadPhoto: adminProcedure
      .input(z.object({ fileName: z.string(), fileBase64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() ?? "jpg";
        const key = `team-photos/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),
  // ─── Publications ─────────────────────────────────────────────────────────────
  publications: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          pubType: z.string().optional(),
          year: z.number().optional(),
          relatedProject: z.string().optional(),
        }).optional()
      )
      .query(({ input }) => getAllPublications(input)),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPublicationById(input.id)),

    lookupDoi: adminProcedure
      .input(z.object({ doi: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          return await lookupDOI(input.doi);
        } catch (e: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: e.message ?? "DOI lookup failed" });
        }
      }),

    parseBibtex: adminProcedure
      .input(z.object({ bibtex: z.string().min(1) }))
      .mutation(({ input }) => {
        try {
          return parseBibtex(input.bibtex);
        } catch (e: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to parse BibTeX" });
        }
      }),

    // Parse a full .bib file with multiple entries — returns preview list
    parseBibFile: adminProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(({ input }) => {
        try {
          const entries = parseMultipleBibtex(input.content);
          if (entries.length === 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "No valid BibTeX entries found in the file." });
          }
          return { entries, count: entries.length };
        } catch (e: any) {
          if (e instanceof TRPCError) throw e;
          throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to parse .bib file" });
        }
      }),

    // Bulk insert multiple parsed entries
    bulkCreate: adminProcedure
      .input(z.array(z.object({
        title: z.string().min(1),
        authors: z.string(),
        year: z.number().nullable().optional(),
        publicationDate: z.string().nullable().optional(),
        journal: z.string().nullable().optional(),
        pages: z.string().nullable().optional(),
        doi: z.string().nullable().optional(),
        url: z.string().nullable().optional(),
        pubType: z.string().default("other"),
        bibtex: z.string().nullable().optional(),
        abstract: z.string().nullable().optional(),
      })))
      .mutation(async ({ input }) => {
        let inserted = 0;
        let skipped = 0;
        const errors: string[] = [];
        for (const entry of input) {
          try {
            await createPublication(entry as any);
            inserted++;
          } catch (e: any) {
            skipped++;
            errors.push(entry.title?.slice(0, 60) ?? "unknown");
          }
        }
        return { inserted, skipped, errors };
      }),

    // Find duplicate publications by title or DOI
    findDuplicates: adminProcedure
      .query(() => getDuplicatePublications()),

    // Delete multiple publications by ID array
    deleteMany: adminProcedure
      .input(z.object({ ids: z.array(z.number()).min(1) }))
      .mutation(async ({ input }) => {
        let deleted = 0;
        for (const id of input.ids) {
          await deletePublication(id);
          deleted++;
        }
        return { deleted };
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          authors: z.string().min(1),
          year: z.number().optional().nullable(),
          publicationDate: z.string().optional().nullable(),
          journal: z.string().optional().nullable(),
          pages: z.string().optional().nullable(),
          doi: z.string().optional().nullable(),
          url: z.string().optional().nullable(),
          relatedProjects: z.string().optional().nullable(),
          pubType: z.string().default("journal"),
          bibtex: z.string().optional().nullable(),
          abstract: z.string().optional().nullable(),
        })
      )
      .mutation(({ input }) => createPublication(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          authors: z.string().optional(),
          year: z.number().optional().nullable(),
          publicationDate: z.string().optional().nullable(),
          journal: z.string().optional().nullable(),
          pages: z.string().optional().nullable(),
          doi: z.string().optional().nullable(),
          url: z.string().optional().nullable(),
          relatedProjects: z.string().optional().nullable(),
          pubType: z.string().optional(),
          bibtex: z.string().optional().nullable(),
          abstract: z.string().optional().nullable(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updatePublication(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletePublication(input.id)),

    exportCitations: publicProcedure
      .input(
        z.object({
          ids: z.array(z.number()).min(1),
          style: z.enum(["ieee", "nature", "aps", "rsc", "apa", "bibtex"]),
        })
      )
      .mutation(async ({ input }) => {
        const all = await getAllPublications();
        const selected = all.filter((p) => input.ids.includes(p.id));
        if (selected.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No publications found for given IDs" });
        }
        const text = formatCitations(selected, input.style as CitationStyle);
        return { text, count: selected.length };
      }),
  }),

  // ─── Research Projects ──────────────────────────────────────────────────────
  research: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().default(false) }))
      .query(({ input }) => getAllResearchProjects(input.activeOnly)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getResearchProjectBySlug(input.slug)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          fullContent: z.string().optional(),
          imageUrl: z.string().optional().nullable(),
          galleryImages: z.array(z.object({ url: z.string(), caption: z.string() })).optional().nullable(),
          tags: z.string().optional().nullable(),
          isActive: z.boolean().default(true),
          displayOrder: z.number().default(0),
        })
      )
      .mutation(({ input }) => createResearchProject(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          fullContent: z.string().optional(),
          imageUrl: z.string().optional().nullable(),
          galleryImages: z.array(z.object({ url: z.string(), caption: z.string() })).optional().nullable(),
          tags: z.string().optional().nullable(),
          isActive: z.boolean().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateResearchProject(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteResearchProject(input.id)),

    uploadImage: adminProcedure
      .input(z.object({ fileName: z.string(), fileBase64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() ?? "jpg";
        const key = `research-images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── News Posts ─────────────────────────────────────────────────────────────
  news: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => getAllNewsPosts(input.limit)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getNewsPostById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          imageUrl: z.string().optional().nullable(),
          externalLink: z.string().optional().nullable(),
          externalLinkLabel: z.string().optional().nullable(),
          postType: z.string().default("general"),
          publishedAt: z.date().optional(),
          timezone: z.string().default("Asia/Singapore"),
        })
      )
      .mutation(({ input }) => createNewsPost(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          imageUrl: z.string().optional().nullable(),
          externalLink: z.string().optional().nullable(),
          externalLinkLabel: z.string().optional().nullable(),
          postType: z.string().optional(),
          publishedAt: z.date().optional(),
          timezone: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateNewsPost(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteNewsPost(input.id)),

    uploadImage: adminProcedure
      .input(z.object({ fileName: z.string(), fileBase64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop() ?? "jpg";
        const key = `news-images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Contact ────────────────────────────────────────────────────────────────
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          senderName: z.string().min(1),
          senderEmail: z.string().email(),
          subject: z.string().optional(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await createContactMessage(input);
        return { success: true };
      }),

    list: adminProcedure.query(() => getAllContactMessages()),

    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markContactMessageRead(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
