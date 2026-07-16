import { useState } from "react";
import { Newspaper, ExternalLink, Calendar, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

const POST_TYPES = ["all", "conference", "workshop", "social", "award", "general"] as const;

function formatDateTime(date: Date | string, timezone: string) {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-SG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
  const timeStr = d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
  return { dateStr, timeStr };
}

function getTimezoneLabel(tz: string) {
  try {
    const now = new Date();
    const short = new Intl.DateTimeFormat("en-SG", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value;
    return short ?? tz;
  } catch {
    return tz;
  }
}

export default function News() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: posts, isLoading } = trpc.news.list.useQuery({});

  const filtered = posts
    ? typeFilter === "all"
      ? posts
      : posts.filter((p) => p.postType === typeFilter)
    : [];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold seeder-section-header mb-3">News &amp; Events</h1>
          <div className="seeder-divider" />
          <p className="text-gray-600 max-w-xl text-base leading-relaxed">
            Updates from the SEEDER Group — conferences, workshops, social events, and more.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="container py-3 flex flex-wrap gap-2">
          {POST_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                typeFilter === type
                  ? "bg-[var(--seeder-navy)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <section className="section-padding bg-[var(--seeder-gray-light)]">
        <div className="container max-w-3xl">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="seeder-card p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-6">
              {filtered.map((post) => {
                const tz = post.timezone ?? "Asia/Singapore";
                const { dateStr, timeStr } = formatDateTime(post.publishedAt, tz);
                const tzLabel = getTimezoneLabel(tz);
                return (
                  <article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="seeder-card overflow-hidden"
                  >
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-56 object-cover"
                      />
                    )}
                    <div className="p-6">
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="seeder-tag-orange capitalize text-xs font-semibold">
                          {post.postType}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar size={12} />
                          {dateStr}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={12} />
                          {timeStr} {tzLabel}
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-bold text-[var(--seeder-navy)] mb-3 leading-snug">
                        {post.title}
                      </h2>

                      {/* Content */}
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* External link */}
                      {post.externalLink && (
                        <a
                          href={post.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
                        >
                          <ExternalLink size={14} />
                          {post.externalLinkLabel ?? "Learn more"}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Newspaper size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                {typeFilter !== "all"
                  ? `No ${typeFilter} posts found.`
                  : "News and events will appear here once posted."}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
