/**
 * Citation formatter for SEEDER publications.
 * Supports: IEEE, Nature, APS, RSC, APA, BibTeX
 */

export type CitationStyle = "ieee" | "nature" | "aps" | "rsc" | "apa" | "bibtex";

export interface PubData {
  id: number;
  title: string;
  authors: string;
  year?: number | null;
  publicationDate?: string | null;
  journal?: string | null;
  pages?: string | null;
  doi?: string | null;
  url?: string | null;
  bibtex?: string | null;
  pubType?: string | null;
}

/** Split "Lastname, Firstname; Lastname2, Firstname2" or "F. Last, G. Last2" into structured parts */
function parseAuthors(raw: string): { first: string; last: string }[] {
  // Handle semicolon-separated or comma-separated lists
  const parts = raw.includes(";")
    ? raw.split(";").map((s) => s.trim())
    : raw.split(",").reduce<string[]>((acc, part, i, arr) => {
        // Heuristic: if the part looks like a first name initial (short), merge with previous
        if (i % 2 === 1) {
          acc[acc.length - 1] = acc[acc.length - 1] + ", " + part.trim();
        } else {
          acc.push(part.trim());
        }
        return acc;
      }, []);

  return parts.map((p) => {
    const trimmed = p.trim();
    // "Last, First" format
    if (trimmed.includes(",")) {
      const [last, ...firstParts] = trimmed.split(",");
      return { last: last.trim(), first: firstParts.join(",").trim() };
    }
    // "First Last" format
    const words = trimmed.split(" ");
    const last = words[words.length - 1];
    const first = words.slice(0, -1).join(" ");
    return { last, first };
  });
}

function initials(first: string): string {
  return first
    .split(/[\s-]+/)
    .map((w) => (w[0] ? w[0].toUpperCase() + "." : ""))
    .join(" ");
}

function doiLink(pub: PubData): string {
  if (pub.doi) return `https://doi.org/${pub.doi}`;
  if (pub.url) return pub.url;
  return "";
}

// ─── IEEE ─────────────────────────────────────────────────────────────────────
// Format: Initials. Lastname, "Title," Journal, vol. X, no. Y, pp. Z, Year. doi: ...
function formatIEEE(pub: PubData): string {
  const authors = parseAuthors(pub.authors);
  const authorStr = authors
    .map((a) => `${initials(a.first)} ${a.last}`)
    .join(", ");

  let citation = `${authorStr}, "${pub.title},"`;
  if (pub.journal) citation += ` *${pub.journal}*,`;
  if (pub.pages) citation += ` pp. ${pub.pages},`;
  if (pub.year) citation += ` ${pub.year}.`;
  const link = doiLink(pub);
  if (link) citation += ` doi: ${link}.`;
  return citation.trim();
}

// ─── Nature ───────────────────────────────────────────────────────────────────
// Format: Lastname, F. I. et al. Title. Journal Year, pages. doi: ...
function formatNature(pub: PubData): string {
  const authors = parseAuthors(pub.authors);
  let authorStr: string;
  if (authors.length > 6) {
    const first = authors[0];
    authorStr = `${first.last}, ${initials(first.first)} et al.`;
  } else {
    authorStr = authors
      .map((a) => `${a.last}, ${initials(a.first)}`)
      .join(", ");
  }

  let citation = `${authorStr} ${pub.title}.`;
  if (pub.journal) citation += ` *${pub.journal}*`;
  if (pub.year) citation += ` **${pub.year}**,`;
  if (pub.pages) citation += ` ${pub.pages}.`;
  const link = doiLink(pub);
  if (link) citation += ` ${link}`;
  return citation.trim();
}

// ─── APS ──────────────────────────────────────────────────────────────────────
// Format: F. I. Lastname, Title, Journal vol, pages (year).
function formatAPS(pub: PubData): string {
  const authors = parseAuthors(pub.authors);
  const authorStr = authors
    .map((a) => `${initials(a.first)} ${a.last}`)
    .join(", ");

  let citation = `${authorStr}, ${pub.title},`;
  if (pub.journal) citation += ` *${pub.journal}*`;
  if (pub.pages) citation += ` ${pub.pages}`;
  if (pub.year) citation += ` (${pub.year}).`;
  const link = doiLink(pub);
  if (link) citation += ` ${link}`;
  return citation.trim();
}

// ─── RSC ──────────────────────────────────────────────────────────────────────
// Format: F. I. Lastname, Journal, Year, pages, DOI.
function formatRSC(pub: PubData): string {
  const authors = parseAuthors(pub.authors);
  const authorStr = authors
    .map((a) => `${initials(a.first)} ${a.last}`)
    .join(", ");

  let citation = `${authorStr}, *${pub.journal ?? pub.title}*,`;
  if (pub.year) citation += ` ${pub.year},`;
  if (pub.pages) citation += ` ${pub.pages},`;
  const link = doiLink(pub);
  if (link) citation += ` ${link}.`;
  else citation = citation.replace(/,$/, ".");
  return citation.trim();
}

// ─── APA ──────────────────────────────────────────────────────────────────────
// Format: Lastname, F. I., & Lastname2, F. I. (Year). Title. Journal, pages. doi: ...
function formatAPA(pub: PubData): string {
  const authors = parseAuthors(pub.authors);
  let authorStr: string;
  if (authors.length > 7) {
    const first6 = authors.slice(0, 6).map((a) => `${a.last}, ${initials(a.first)}`);
    const last = authors[authors.length - 1];
    authorStr = first6.join(", ") + `, ... ${last.last}, ${initials(last.first)}`;
  } else if (authors.length === 1) {
    authorStr = `${authors[0].last}, ${initials(authors[0].first)}`;
  } else {
    const allButLast = authors
      .slice(0, -1)
      .map((a) => `${a.last}, ${initials(a.first)}`)
      .join(", ");
    const last = authors[authors.length - 1];
    authorStr = `${allButLast}, & ${last.last}, ${initials(last.first)}`;
  }

  let citation = `${authorStr} (${pub.year ?? "n.d."}). ${pub.title}.`;
  if (pub.journal) citation += ` *${pub.journal}*,`;
  if (pub.pages) citation += ` ${pub.pages}.`;
  const link = doiLink(pub);
  if (link) citation += ` ${link}`;
  return citation.trim();
}

// ─── BibTeX ───────────────────────────────────────────────────────────────────
function formatBibtex(pub: PubData): string {
  // Return stored BibTeX if available
  if (pub.bibtex && pub.bibtex.trim().startsWith("@")) {
    return pub.bibtex.trim();
  }

  // Generate a BibTeX entry
  const authors = parseAuthors(pub.authors);
  const firstAuthorLast = authors[0]?.last ?? "Unknown";
  const key = `${firstAuthorLast.toLowerCase().replace(/\s+/g, "")}${pub.year ?? ""}`;
  const entryType = pub.pubType === "conference" ? "inproceedings" : "article";
  const venueField = pub.pubType === "conference" ? "booktitle" : "journal";

  const fields: [string, string][] = [
    ["title", `{${pub.title}}`],
    ["author", `{${pub.authors}}`],
  ];
  if (pub.journal) fields.push([venueField, `{${pub.journal}}`]);
  if (pub.year) fields.push(["year", `{${pub.year}}`]);
  if (pub.pages) fields.push(["pages", `{${pub.pages}}`]);
  if (pub.doi) fields.push(["doi", `{${pub.doi}}`]);
  if (pub.url) fields.push(["url", `{${pub.url}}`]);

  const body = fields.map(([k, v]) => `  ${k} = ${v}`).join(",\n");
  return `@${entryType}{${key},\n${body}\n}`;
}

// ─── Main formatter ───────────────────────────────────────────────────────────
export function formatCitation(pub: PubData, style: CitationStyle): string {
  switch (style) {
    case "ieee":    return formatIEEE(pub);
    case "nature":  return formatNature(pub);
    case "aps":     return formatAPS(pub);
    case "rsc":     return formatRSC(pub);
    case "apa":     return formatAPA(pub);
    case "bibtex":  return formatBibtex(pub);
    default:        return formatIEEE(pub);
  }
}

export function formatCitations(pubs: PubData[], style: CitationStyle): string {
  if (style === "bibtex") {
    return pubs.map((p) => formatCitation(p, style)).join("\n\n");
  }
  return pubs
    .map((p, i) => `[${i + 1}] ${formatCitation(p, style)}`)
    .join("\n\n");
}
