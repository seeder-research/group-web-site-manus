import { Link } from "wouter";
import { ArrowRight, Cpu, Zap, Layers, BookOpen, Users, Newspaper } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

const SEEDER_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663266958733/CSgXpzMp2rRL2M7brVNnRo/seeder-logo-original_31f091fb.png";

const pillars = [
  {
    icon: <Layers size={28} />,
    title: "Materials & Devices",
    desc: "Exploring novel materials and device architectures for ultra-low-power operation.",
  },
  {
    icon: <Cpu size={28} />,
    title: "Circuits & Architecture",
    desc: "Designing circuits and system architectures that co-optimize performance and energy.",
  },
  {
    icon: <Zap size={28} />,
    title: "Applications",
    desc: "Targeting real-world applications in AI inference, edge computing, and IoT.",
  },
];

function formatPostDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-SG", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function Home() {
  const { data: recentNews } = trpc.news.list.useQuery({ limit: 3 });
  const { data: projects } = trpc.research.list.useQuery({ activeOnly: true });

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--seeder-navy)]/8 rounded-full px-4 py-1.5 text-sm text-[var(--seeder-navy)] mb-6">
                <Zap size={14} className="text-[var(--seeder-orange)]" />
                National University of Singapore
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-[var(--seeder-navy)]">
                Scalable &amp; Energy Efficient<br />
                Devices &amp; Electronics Research<br />
                <span className="text-[var(--seeder-orange)]">(SEEDER) Group</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                The SEEDER Group explores Application-Technology Co-Optimization — finding pathways
                across the materials-devices-circuits-architecture-applications design stack towards
                evermore energy efficient electronics.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 bg-[var(--seeder-orange)] hover:bg-[var(--seeder-orange-light)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Explore Research <ArrowRight size={16} />
                </Link>
                <Link
                  href="/team"
                  className="inline-flex items-center gap-2 bg-[var(--seeder-navy)] hover:bg-[var(--seeder-navy-light)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Meet the Team
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--seeder-orange)]/5 rounded-2xl blur-3xl" />
                <img
                  src={SEEDER_LOGO}
                  alt="SEEDER Group Logo"
                  className="relative w-full max-w-sm object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Research Focus ────────────────────────────────────────────────── */}
      <section className="section-padding bg-[var(--seeder-gray-light)]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold seeder-section-header">Our Research Focus</h2>
            <div className="seeder-divider mx-auto" />
            <p className="text-gray-600 max-w-2xl mx-auto text-base leading-relaxed">
              We pursue <strong>Application-Technology Co-Optimization</strong> — a holistic approach
              that simultaneously considers all layers of the electronics design stack to unlock
              unprecedented energy efficiency.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="seeder-card p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-[rgba(26,39,68,0.07)] flex items-center justify-center mx-auto mb-4 text-[var(--seeder-navy)]">
                  {p.icon}
                </div>
                <h3 className="font-semibold text-[var(--seeder-navy)] text-lg mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/research"
              className="inline-flex items-center gap-2 text-[var(--seeder-navy)] font-semibold hover:text-[var(--seeder-orange)] transition-colors"
            >
              View all research projects <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Active Projects ───────────────────────────────────────────────── */}
      {projects && projects.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container">
            <div className="mb-10">
              <h2 className="text-3xl font-bold seeder-section-header">Active Projects</h2>
              <div className="seeder-divider" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/research/${project.slug}`}>
                  <div className="seeder-card overflow-hidden h-full">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 hero-gradient flex items-center justify-center">
                        <Cpu size={40} className="text-white/40" />
                      </div>
                    )}
                    <div className="p-5">
                      {project.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.tags.split(",").slice(0, 3).map((tag) => (
                            <span key={tag} className="seeder-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold text-[var(--seeder-navy)] text-base leading-snug mb-2">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <section className="circuit-bg text-white section-padding-sm">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Team Members", value: "12+", icon: <Users size={24} /> },
              { label: "Publications", value: "50+", icon: <BookOpen size={24} /> },
              { label: "Research Projects", value: "5+", icon: <Layers size={24} /> },
              { label: "Years Active", value: "5+", icon: <Zap size={24} /> },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-center mb-2 text-[var(--seeder-orange)]">{stat.icon}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent News ───────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold seeder-section-header">Latest News</h2>
              <div className="seeder-divider" />
            </div>
            <Link
              href="/news"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
            >
              All news <ArrowRight size={14} />
            </Link>
          </div>

          {recentNews && recentNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentNews.map((post) => (
                <Link key={post.id} href={`/news#post-${post.id}`}>
                  <div className="seeder-card overflow-hidden h-full">
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="seeder-tag-orange text-xs">{post.postType}</span>
                        <span className="text-xs text-gray-400">{formatPostDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--seeder-navy)] text-sm leading-snug mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">News and updates will appear here.</p>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/news" className="text-sm text-[var(--seeder-navy)] font-medium">
              View all news →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section-padding-sm bg-[var(--seeder-gray-light)] border-t border-gray-200">
        <div className="container text-center">
          <h2 className="text-2xl font-bold seeder-section-header mb-3">
            Interested in Collaborating?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
            We welcome collaborations with academic institutions and industry partners in the field of
            energy-efficient electronics.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[var(--seeder-navy)] hover:bg-[var(--seeder-navy-light)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Get in Touch <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
