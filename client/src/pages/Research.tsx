import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Cpu, ArrowRight, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

export default function Research() {
  const { data: projects, isLoading } = trpc.research.list.useQuery({ activeOnly: false });
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags across all projects
  const allTags = useMemo(() => {
    if (!projects) return [];
    const tagSet = new Set<string>();
    projects.forEach((p) => {
      if (p.tags) p.tags.split(",").forEach((t) => tagSet.add(t.trim()));
    });
    return Array.from(tagSet).sort();
  }, [projects]);

  // Filter projects by search text and/or active tag
  const filtered = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.tags ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesTag =
        !activeTag ||
        (p.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [projects, search, activeTag]);

  return (
    <Layout>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold seeder-section-header mb-3">Research</h1>
          <div className="seeder-divider" />
          <p className="text-gray-600 max-w-2xl text-base leading-relaxed">
            Our research is centered on Application-Technology Co-Optimization (ATCO) — a holistic methodology
            that explores the relationships across the full electronics design stack to unlock
            pathways towards evermore energy efficient electronics.
          </p>
        </div>
      </section>

      {/* ── Research Focus ────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold seeder-section-header mb-2">Current Research Focus</h2>
          <div className="seeder-divider" />
          <div className="bg-[var(--seeder-gray-light)] rounded-2xl p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-[var(--seeder-navy)] mb-3">
              ATCO of Scalable Compute-In-Memory Systems: from Edge to Datacenter Scale
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Compute-In-Memory (CIM) is a paradigm that performs computation directly within the
              memory array, dramatically reducing the energy cost of data movement — the dominant
              bottleneck in modern AI hardware. The SEEDER Group investigates how to co-optimize
              across all layers of the design stack, from the underlying device physics and memory
              materials, through circuit design and array architecture, up to the algorithm and
              application level.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By understanding the interplay between these layers, we identify design trade-offs and
              synergies that are invisible when each layer is optimized in isolation. This enables us
              to propose solutions that are simultaneously more energy efficient, more accurate, and
              more scalable than conventional approaches.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                "Compute-In-Memory",
                "Non-Volatile Memory",
                "Neural Network Inference",
                "Edge AI",
                "Spintronics",
                "RRAM",
                "Hardware-Algorithm Co-Design",
              ].map((tag) => (
                <span key={tag} className="seeder-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Design Stack Diagram ─────────────────────────────────────────── */}
      <section className="section-padding-sm bg-[var(--seeder-gray-light)]">
        <div className="container">
          <h2 className="text-2xl font-bold seeder-section-header mb-2">The Design Stack</h2>
          <div className="seeder-divider" />
          <p className="text-gray-600 mb-8 text-sm max-w-2xl">
            We explore co-optimization opportunities across all five layers of the electronics design
            hierarchy simultaneously.
          </p>
          <div className="flex flex-col gap-2 max-w-lg">
            {[
              { label: "Applications", sub: "AI inference, domain-specific computing", color: "bg-[var(--seeder-orange)]" },
              { label: "Architecture", sub: "Accelerator design, memory hierarchy", color: "bg-[#c96e30]" },
              { label: "Circuits", sub: "Memory bitcells, CiM macros, digital/AMS design", color: "bg-[#2a4a7f]" },
              { label: "Devices", sub: "Transistors, storage devices, optoelectronics", color: "bg-[#1f3a6e]" },
              { label: "Materials", sub: "Resistive switching, ferroelectric, spintronics", color: "bg-[var(--seeder-navy)]" },
            ].map((layer, i) => (
              <div
                key={layer.label}
                className={`${layer.color} text-white rounded-lg px-6 py-3 flex items-center justify-between`}
                style={{ marginLeft: `${i * 12}px`, marginRight: `${(4 - i) * 12}px` }}
              >
                <span className="font-semibold">{layer.label}</span>
                <span className="text-xs text-white/70 hidden sm:block">{layer.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ─────────────────────────────────────────────────────── */}
      <section id="research-projects" className="section-padding bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold seeder-section-header mb-2">Research Projects</h2>
          <div className="seeder-divider" />

          {/* Search + tag filter bar */}
          {!isLoading && projects && projects.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)] transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Tag pills */}
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      activeTag === tag
                        ? "bg-[var(--seeder-navy)] text-white border-[var(--seeder-navy)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="seeder-card p-5 animate-pulse">
                  <div className="h-40 bg-gray-100 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <Link key={project.id} href={`/research/${project.slug}`}>
                  <div className="seeder-card overflow-hidden h-full flex flex-col group relative">
                    {/* Image area */}
                    {project.imageUrl ? (
                      <div className="w-full h-44 bg-white flex items-center justify-center p-3 overflow-hidden relative">
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Hover overlay with summary */}
                        {project.description && (
                          <div className="absolute inset-0 bg-[var(--seeder-navy)]/90 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-xs leading-relaxed line-clamp-6 text-center">
                              {project.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-44 hero-gradient flex items-center justify-center relative overflow-hidden">
                        <Cpu size={48} className="text-white/30" />
                        {/* Hover overlay for no-image cards */}
                        {project.description && (
                          <div className="absolute inset-0 bg-[var(--seeder-navy)]/90 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-xs leading-relaxed line-clamp-6 text-center">
                              {project.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {project.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.tags.split(",").slice(0, 3).map((tag) => (
                            <span key={tag} className="seeder-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold text-[var(--seeder-navy)] text-base leading-snug mb-2 flex-1">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[var(--seeder-orange)] text-sm font-medium mt-auto">
                        Learn more <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No projects match your search.</p>
              <button
                onClick={() => { setSearch(""); setActiveTag(null); }}
                className="mt-2 text-xs text-[var(--seeder-orange)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Cpu size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Research projects will appear here once added.</p>
              <p className="text-xs mt-1 text-gray-300">Admins can add projects via the admin panel.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
