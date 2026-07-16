import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Shield, ChevronDown, FlaskConical } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const SEEDER_LOGO_NARROW = "https://d2xsxph8kpxj0f.cloudfront.net/310519663266958733/CSgXpzMp2rRL2M7brVNnRo/seeder-logo-narrow_7f157625.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Research", href: "/research" },
  { label: "Team", href: "/team" },
  { label: "Publications", href: "/publications" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

/** Dropdown items for the Research nav entry */
const researchDropdown = [
  { label: "Research Projects", href: "/research#research-projects", icon: FlaskConical },
];

export default function NavBar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const researchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setResearchOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (researchRef.current && !researchRef.current.contains(e.target as Node)) {
        setResearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-md border-b border-gray-100"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src={SEEDER_LOGO_NARROW}
              alt="SEEDER Group"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? location === "/"
                  : location.startsWith(link.href);

              // Research gets a hover dropdown
              if (link.label === "Research") {
                return (
                  <div
                    key={link.href}
                    ref={researchRef}
                    className="relative"
                    onMouseEnter={() => setResearchOpen(true)}
                    onMouseLeave={() => setResearchOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={`inline-flex items-center gap-0.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "text-[var(--seeder-navy)] bg-[rgba(26,39,68,0.07)]"
                          : "text-gray-600 hover:text-[var(--seeder-navy)] hover:bg-[rgba(26,39,68,0.05)]"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        size={13}
                        className={`ml-0.5 transition-transform duration-200 ${researchOpen ? "rotate-180" : ""}`}
                      />
                    </Link>

                    {/* Dropdown panel */}
                    <div
                      className={`absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 transition-all duration-200 origin-top ${
                        researchOpen
                          ? "opacity-100 scale-y-100 pointer-events-auto"
                          : "opacity-0 scale-y-95 pointer-events-none"
                      }`}
                    >
                      {researchDropdown.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-[rgba(26,39,68,0.05)] hover:text-[var(--seeder-navy)] transition-colors"
                          onClick={() => setResearchOpen(false)}
                        >
                          <item.icon size={14} className="text-[var(--seeder-orange)] shrink-0" />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-[var(--seeder-navy)] bg-[rgba(26,39,68,0.07)]"
                      : "text-gray-600 hover:text-[var(--seeder-navy)] hover:bg-[rgba(26,39,68,0.05)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Admin link for admin users */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                location.startsWith("/admin")
                  ? "text-[var(--seeder-orange)] bg-[rgba(224,123,57,0.08)]"
                  : "text-[var(--seeder-orange)] hover:bg-[rgba(224,123,57,0.08)]"
              }`}
            >
              <Shield size={14} /> Admin
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-[var(--seeder-navy)] hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? location === "/"
                  : location.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--seeder-navy)] bg-[rgba(26,39,68,0.07)]"
                      : "text-gray-600 hover:text-[var(--seeder-navy)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {/* Mobile: Research Projects sub-link */}
            <a
              href="/research#research-projects"
              className="px-4 py-2 ml-4 rounded-md text-xs text-gray-500 hover:text-[var(--seeder-navy)] hover:bg-gray-50 flex items-center gap-2"
            >
              <FlaskConical size={12} className="text-[var(--seeder-orange)]" />
              Research Projects
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
