import { useState, useMemo } from "react";
import {
  BookOpen, Search, ExternalLink, Copy, Check,
  SortAsc, SortDesc, Users, Calendar, FileText,
  Download, X, CheckSquare, Square,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { toast } from "sonner";

type SortOrder = "newest" | "oldest";
type PubTypeFilter = "all" | "journal" | "conference" | "other";
type CitationStyle = "ieee" | "nature" | "aps" | "rsc" | "apa" | "bibtex";

const PUB_TYPE_LABEL: Record<string, string> = {
  journal: "Journal",
  conference: "Conference",
  other: "Other",
};

const PUB_TYPE_BADGE: Record<string, string> = {
  journal: "bg-blue-100 text-blue-700",
  conference: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

const CITATION_STYLES: { key: CitationStyle; label: string }[] = [
  { key: "ieee",    label: "IEEE" },
  { key: "nature",  label: "Nature" },
  { key: "aps",     label: "APS" },
  { key: "rsc",     label: "RSC" },
  { key: "apa",     label: "APA" },
  { key: "bibtex",  label: "BibTeX" },
];

function PublicationCard({
  pub,
  projects,
  selected,
  onToggle,
}: {
  pub: any;
  projects: any[];
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const paperUrl = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : null);
  const typeKey = pub.pubType ?? "journal";

  const handleCopyBibtex = () => {
    if (pub.bibtex) {
      navigator.clipboard.writeText(pub.bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`seeder-card p-5 hover:shadow-md transition-all cursor-pointer ${
        selected ? "ring-2 ring-[var(--seeder-orange)] bg-orange-50/30" : ""
      }`}
      onClick={() => onToggle(pub.id)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className="shrink-0 mt-0.5 text-[var(--seeder-orange)]"
          onClick={(e) => { e.stopPropagation(); onToggle(pub.id); }}
        >
          {selected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Type badge + title */}
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span
              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                PUB_TYPE_BADGE[typeKey] ?? PUB_TYPE_BADGE.journal
              }`}
            >
              {PUB_TYPE_LABEL[typeKey] ?? "Journal"}
            </span>
            <h3 className="text-sm font-semibold text-[var(--seeder-navy)] leading-snug">
              {paperUrl ? (
                <a
                  href={paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--seeder-orange)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {pub.title}
                </a>
              ) : (
                pub.title
              )}
            </h3>
          </div>

          {/* Authors */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
            <Users size={11} className="shrink-0 text-gray-400" />
            <span className="line-clamp-2">{pub.authors}</span>
          </div>

          {/* Journal/Conference + pages */}
          {pub.journal && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <FileText size={11} className="shrink-0 text-gray-400" />
              <span className="italic">{pub.journal}</span>
              {pub.pages && (
                <span className="not-italic text-gray-400">· pp.&nbsp;{pub.pages}</span>
              )}
            </div>
          )}

          {/* Date */}
          {pub.publicationDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Calendar size={11} className="shrink-0" />
              <span>{pub.publicationDate}</span>
            </div>
          )}

          {/* Related projects */}
          {pub.relatedProjects && (
            <div className="flex flex-wrap gap-1 mt-2">
              {pub.relatedProjects
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
                .map((slug: string) => {
                  const proj = projects.find((p) => p.slug === slug);
                  return (
                    <span
                      key={slug}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--seeder-navy)]/8 text-[var(--seeder-navy)] font-medium"
                    >
                      {proj?.title ?? slug}
                    </span>
                  );
                })}
            </div>
          )}

          {/* Abstract (collapsible) */}
          {pub.abstract && (
            <details className="mt-3" onClick={(e) => e.stopPropagation()}>
              <summary className="text-xs text-[var(--seeder-navy)] cursor-pointer font-medium hover:text-[var(--seeder-orange)] transition-colors">
                Abstract
              </summary>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{pub.abstract}</p>
            </details>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {paperUrl && (
            <a
              href={paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-[var(--seeder-gray-light)] hover:bg-[var(--seeder-navy)] hover:text-white flex items-center justify-center transition-colors text-gray-400"
              title={pub.url ? "Open link" : `Open via DOI: ${pub.doi}`}
            >
              <ExternalLink size={13} />
            </a>
          )}
          {!paperUrl && (
            <div
              className="w-8 h-8 rounded-lg bg-[var(--seeder-gray-light)] flex items-center justify-center text-gray-200 cursor-default"
              title="No link available"
            >
              <ExternalLink size={13} />
            </div>
          )}
          {pub.bibtex && (
            <button
              onClick={handleCopyBibtex}
              className="w-8 h-8 rounded-lg bg-[var(--seeder-gray-light)] hover:bg-[var(--seeder-navy)] hover:text-white flex items-center justify-center transition-colors text-gray-400"
              title="Copy BibTeX"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export Panel ─────────────────────────────────────────────────────────────
function ExportPanel({
  selectedIds,
  onClear,
}: {
  selectedIds: number[];
  onClear: () => void;
}) {
  const [style, setStyle] = useState<CitationStyle>("ieee");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportMutation = trpc.publications.exportCitations.useMutation({
    onSuccess: (data) => {
      setResult(data.text);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleExport = () => {
    setResult(null);
    exportMutation.mutate({ ids: selectedIds, style });
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = style === "bibtex" ? "bib" : "txt";
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seeder-publications-${style}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[var(--seeder-navy)] text-white">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-[var(--seeder-orange)]" />
            <span className="text-sm font-semibold">
              {selectedIds.length} publication{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-white/60 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium">Format:</span>
            {CITATION_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => { setStyle(s.key); setResult(null); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  style === s.key
                    ? "bg-[var(--seeder-navy)] text-white border-[var(--seeder-navy)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)]"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-[var(--seeder-orange)] hover:bg-[var(--seeder-orange-light)] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {exportMutation.isPending ? "Generating…" : "Generate"}
            </button>
          </div>

          {/* Result area */}
          {result && (
            <div className="space-y-2">
              <textarea
                readOnly
                value={result}
                rows={6}
                className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)] transition-colors bg-white"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--seeder-navy)] text-white rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Publications() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<PubTypeFilter>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: publications = [], isLoading } = trpc.publications.list.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { data: projects = [] } = trpc.research.list.useQuery({ activeOnly: false });

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(publications.map((p) => p.year).filter(Boolean))
    ) as number[];
    return years.sort((a, b) => b - a);
  }, [publications]);

  const filtered = useMemo(() => {
    let result = [...publications];
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.authors.toLowerCase().includes(term) ||
          (p.journal ?? "").toLowerCase().includes(term)
      );
    }
    if (selectedType !== "all") {
      result = result.filter((p) => (p.pubType ?? "journal") === selectedType);
    }
    if (selectedProject !== "all") {
      result = result.filter((p) =>
        (p.relatedProjects ?? "")
          .split(",")
          .map((s: string) => s.trim())
          .includes(selectedProject)
      );
    }
    if (selectedYear !== "all") {
      result = result.filter((p) => String(p.year) === selectedYear);
    }
    result.sort((a, b) => {
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;
      return sortOrder === "newest" ? yb - ya : ya - yb;
    });
    return result;
  }, [publications, search, selectedType, selectedProject, selectedYear, sortOrder]);

  const groupedByYear = useMemo(() => {
    const groups: { year: number | null; items: typeof filtered }[] = [];
    let currentYear: number | null | undefined = undefined;
    for (const pub of filtered) {
      const y = pub.year ?? null;
      if (y !== currentYear) {
        currentYear = y;
        groups.push({ year: y, items: [pub] });
      } else {
        groups[groups.length - 1].items.push(pub);
      }
    }
    return groups;
  }, [filtered]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const hasActiveFilters =
    search || selectedType !== "all" || selectedProject !== "all" || selectedYear !== "all";

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold seeder-section-header mb-3">Publications</h1>
          <div className="seeder-divider" />
          <p className="text-gray-600 max-w-xl text-base leading-relaxed">
            Research outputs from the SEEDER Group spanning devices, circuits, architecture, and
            application-technology co-optimization. Select publications to export citations in your
            preferred format.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[var(--seeder-gray-light)]" style={{ paddingBottom: selectedIds.size > 0 ? "10rem" : undefined }}>
        <div className="container">
          {/* Filters card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
            {/* Search + sort row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, or journal…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)]"
                />
              </div>
              <button
                onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)] transition-colors bg-white whitespace-nowrap"
              >
                {sortOrder === "newest" ? (
                  <><SortDesc size={15} /> Newest First</>
                ) : (
                  <><SortAsc size={15} /> Oldest First</>
                )}
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 font-medium">Type:</span>
              {(["all", "journal", "conference", "other"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedType === t
                      ? "bg-[var(--seeder-navy)] text-white border-[var(--seeder-navy)]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)]"
                  }`}
                >
                  {t === "all" ? "All Types" : PUB_TYPE_LABEL[t]}
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

              <span className="text-xs text-gray-400 font-medium">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)] bg-white text-gray-700"
              >
                <option value="all">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>

              {projects.length > 0 && (
                <>
                  <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
                  <span className="text-xs text-gray-400 font-medium">Project:</span>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)] bg-white text-gray-700 max-w-[200px]"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.title}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Result count + select all + clear */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  {isLoading
                    ? "Loading…"
                    : `${filtered.length} publication${filtered.length !== 1 ? "s" : ""} found`}
                </p>
                {filtered.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
                  >
                    {allFilteredSelected ? (
                      <><CheckSquare size={13} /> Deselect all</>
                    ) : (
                      <><Square size={13} /> Select all {filtered.length > 0 ? `(${filtered.length})` : ""}</>
                    )}
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearch(""); setSelectedType("all");
                    setSelectedProject("all"); setSelectedYear("all");
                  }}
                  className="text-xs text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Publications list */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="seeder-card p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">No publications found</p>
              <p className="text-sm text-gray-400 mt-1">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria."
                  : "Publications will appear here once added via the Admin panel."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearch(""); setSelectedType("all");
                    setSelectedProject("all"); setSelectedYear("all");
                  }}
                  className="mt-4 text-sm text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {groupedByYear.map(({ year, items }) => (
                <div key={year ?? "unknown"}>
                  {/* Year separator */}
                  <div className="flex items-center gap-4 py-4">
                    <span className="text-lg font-bold text-[var(--seeder-navy)] shrink-0">
                      {year ?? "Year Unknown"}
                    </span>
                    <div className="flex-1 h-px bg-[var(--seeder-navy)]/15" />
                    <span className="text-xs text-gray-400 shrink-0">
                      {items.length} paper{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3 mb-2">
                    {items.map((pub) => (
                      <PublicationCard
                        key={pub.id}
                        pub={pub}
                        projects={projects}
                        selected={selectedIds.has(pub.id)}
                        onToggle={toggleId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Export panel — appears when publications are selected */}
      {selectedIds.size > 0 && (
        <ExportPanel
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </Layout>
  );
}
