import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock database ────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getAllTeamMembers: vi.fn().mockResolvedValue([]),
  getTeamMemberById: vi.fn().mockResolvedValue(null),
  createTeamMember: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateTeamMember: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  deleteTeamMember: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  getAllPublications: vi.fn().mockResolvedValue([]),
  getPublicationById: vi.fn().mockResolvedValue(null),
  createPublication: vi.fn().mockResolvedValue({ insertId: 1 }),
  updatePublication: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  deletePublication: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  getAllResearchProjects: vi.fn().mockResolvedValue([]),
  getResearchProjectBySlug: vi.fn().mockResolvedValue(null),
  getResearchProjectById: vi.fn().mockResolvedValue(null),
  createResearchProject: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateResearchProject: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  deleteResearchProject: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  getAllNewsPosts: vi.fn().mockResolvedValue([]),
  getNewsPostById: vi.fn().mockResolvedValue(null),
  createNewsPost: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateNewsPost: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  deleteNewsPost: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  createContactMessage: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllContactMessages: vi.fn().mockResolvedValue([]),
  markContactMessageRead: vi.fn().mockResolvedValue({ affectedRows: 1 }),
}));

// ─── Mock S3 storage ──────────────────────────────────────────────────────────
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@nus.edu.sg",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@nus.edu.sg",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user object for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@nus.edu.sg");
    expect(result?.role).toBe("admin");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Team tests ───────────────────────────────────────────────────────────────
describe("team", () => {
  it("list returns empty array when no members exist", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.team.list({ isAlumni: false });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.team.create({
        name: "Test Member",
        category: "Ph.D.",
        isAlumni: false,
        biography: null,
        email: null,
        researchInterests: null,
        photoUrl: null,
        displayOrder: 0,
      })
    ).rejects.toThrow();
  });

  it("create succeeds for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.team.create({
        name: "Dr. Test",
        category: "Principal Investigator",
        isAlumni: false,
        biography: "Test biography",
        email: "test@nus.edu.sg",
        researchInterests: "CIM, RRAM",
        photoUrl: undefined,
        displayOrder: 0,
      })
    ).resolves.toBeDefined();
  });

  it("delete requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.team.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Publications tests ───────────────────────────────────────────────────────
describe("publications", () => {
  it("list is publicly accessible", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.publications.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.publications.create({
        title: "Test Paper",
        authors: "Author A, Author B",
        year: 2024,
        publicationDate: "2024",
        journal: "IEEE ISSCC",
        pages: "1-4",
        doi: "10.1109/test",
        link: null,
        bibtex: null,
        abstract: null,
      })
    ).rejects.toThrow();
  });

  it("create succeeds for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.publications.create({
        title: "Test Paper",
        authors: "Author A, Author B",
        year: 2024,
        publicationDate: "2024",
        journal: "IEEE ISSCC",
        pages: "1-4",
        doi: "10.1109/test",
        link: undefined,
        bibtex: undefined,
        abstract: undefined,
      })
    ).resolves.toBeDefined();
  });

  it("parseBibtex extracts title and authors", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const bibtex = `@article{test2024,
      title={A Test Paper on CIM},
      author={Smith, John and Doe, Jane},
      journal={IEEE Transactions},
      year={2024},
      pages={1--10},
      doi={10.1109/test.2024}
    }`;
    const result = await caller.publications.parseBibtex({ bibtex });
    expect(result.title).toContain("Test Paper");
    expect(result.authors).toContain("John");
    expect(result.year).toBe(2024);
  });
});

// ─── Research tests ───────────────────────────────────────────────────────────
describe("research", () => {
  it("list is publicly accessible", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.research.list({ activeOnly: true });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getBySlug returns null for non-existent slug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.research.getBySlug({ slug: "non-existent-project" });
    expect(result).toBeNull();
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.research.create({
        title: "Test Project",
        slug: "test-project",
        description: "A test project",
        fullContent: null,
        imageUrl: null,
        tags: null,
        isActive: true,
        displayOrder: 0,
      })
    ).rejects.toThrow();
  });

  it("create succeeds for admin with valid slug", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // Should not throw
    await expect(
      caller.research.create({
        title: "CIM Research Project",
        slug: "cim-research-project",
        description: "Compute-In-Memory research",
        fullContent: undefined,
        imageUrl: null,
        tags: "CIM, RRAM",
        isActive: true,
        displayOrder: 1,
      })
    ).resolves.toBeDefined();
  });
});

// ─── News tests ───────────────────────────────────────────────────────────────
describe("news", () => {
  it("list is publicly accessible", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.news.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.news.create({
        title: "Test Event",
        content: "Test content",
        postType: "conference",
        publishedAt: new Date(),
        timezone: "Asia/Singapore",
        imageUrl: null,
        externalLink: null,
        externalLinkLabel: null,
      })
    ).rejects.toThrow();
  });

  it("create succeeds for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.news.create({
        title: "ISSCC 2024",
        content: "Our paper was accepted at ISSCC 2024.",
        postType: "conference",
        publishedAt: new Date("2024-02-18"),
        timezone: "Asia/Singapore",
        imageUrl: null,
        externalLink: "https://isscc.org",
        externalLinkLabel: "ISSCC Website",
      })
    ).resolves.toBeDefined();
  });
});

// ─── Contact tests ────────────────────────────────────────────────────────────
describe("contact", () => {
  it("submit is publicly accessible", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.contact.submit({
      senderName: "John Doe",
      senderEmail: "john@example.com",
      subject: "Research Inquiry",
      message: "I am interested in joining your group.",
    });
    expect(result.success).toBe(true);
  });

  it("list requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.contact.list()).rejects.toThrow();
  });

  it("list is accessible to admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.contact.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("markRead requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.contact.markRead({ id: 1 })).rejects.toThrow();
  });
});
