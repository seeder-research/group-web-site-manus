import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Tag, Cpu, X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: { url: string; caption: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const current = images[idx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Image */}
        <img
          src={current?.url}
          alt={current?.caption || `Image ${idx + 1}`}
          className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
        />

        {/* Caption */}
        {current?.caption && (
          <p className="mt-3 text-white/80 text-sm text-center max-w-xl">{current.caption}</p>
        )}

        {/* Counter */}
        <p className="mt-1 text-white/50 text-xs">
          {idx + 1} / {images.length}
        </p>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={36} />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight size={36} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResearchProject() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = trpc.research.getBySlug.useQuery({ slug: slug ?? "" });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Fetch publications linked to this project (by slug / title match)
  const { data: allPubs } = trpc.publications.list.useQuery(
    { relatedProject: slug },
    { enabled: !!slug }
  );

  // Up to 5 most recent linked publications
  const selectedPubs = (allPubs ?? [])
    .slice()
    .sort((a, b) => {
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;
      return yb - ya;
    })
    .slice(0, 5);

  const gallery: { url: string; caption: string }[] = Array.isArray(project?.galleryImages)
    ? (project.galleryImages as { url: string; caption: string }[])
    : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-gray-400">Loading project...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Cpu size={48} className="mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-semibold text-gray-500">Project not found</h2>
          <Link href="/research" className="mt-4 inline-flex items-center gap-2 text-[var(--seeder-navy)] text-sm font-medium">
            <ArrowLeft size={14} /> Back to Research
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Lightbox overlay */}
      {lightboxIdx !== null && gallery.length > 0 && (
        <Lightbox images={gallery} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Page Header */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <Link href="/research" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--seeder-navy)] text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Research
          </Link>

          <div>
            {project.tags && (
              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.split(",").map((tag) => (
                  <span key={tag} className="seeder-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold seeder-section-header leading-tight max-w-3xl">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">{project.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container max-w-4xl">

          {/* Selected Publications — up to 5 most recent linked entries */}
          {selectedPubs.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold seeder-section-header mb-4">Selected Publications</h2>
              <ol className="space-y-3 list-decimal list-inside">
                {selectedPubs.map((pub, i) => {
                  const paperUrl = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : null);
                  return (
                    <li key={pub.id} className="text-sm text-gray-700 leading-relaxed pl-1">
                      <span className="font-medium text-gray-900">{pub.authors}</span>
                      {", "}
                      {paperUrl ? (
                        <a
                          href={paperUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--seeder-navy)] hover:underline font-medium"
                        >
                          {pub.title}
                        </a>
                      ) : (
                        <span className="font-medium">{pub.title}</span>
                      )}
                      {pub.journal && <span className="italic">, {pub.journal}</span>}
                      {pub.pages && <span>, {pub.pages}</span>}
                      {pub.year && <span> ({pub.year})</span>}
                      {pub.doi && (
                        <span className="text-gray-400 text-xs ml-1">
                          DOI: {pub.doi}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Full Content */}
          {project.fullContent && (
            <div className="prose-seeder text-gray-700 leading-relaxed whitespace-pre-wrap mb-10">
              {project.fullContent}
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold seeder-section-header mb-4">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gallery.map((item, idx) => (
                  <div key={idx} className="group cursor-pointer" onClick={() => setLightboxIdx(idx)}>
                    <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm aspect-square">
                      <img
                        src={item.url}
                        alt={item.caption || `Gallery image ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                    {item.caption && (
                      <p className="mt-1.5 text-xs text-gray-500 text-center leading-snug">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
