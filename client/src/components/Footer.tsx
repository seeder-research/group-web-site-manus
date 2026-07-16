import { Link } from "wouter";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const SEEDER_LOGO_NARROW = "https://d2xsxph8kpxj0f.cloudfront.net/310519663266958733/CSgXpzMp2rRL2M7brVNnRo/seeder-logo-narrow_7f157625.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Main footer content */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div>
            <img
              src={SEEDER_LOGO_NARROW}
              alt="SEEDER Group"
              className="h-10 w-auto object-contain mb-4"
            />
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Scalable &amp; Energy Efficient Devices &amp; Electronics Research Group
            </p>
            <p className="text-sm text-gray-500 mt-2">
              National University of Singapore
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "Research", href: "/research" },
                { label: "Team", href: "/team" },
                { label: "Publications", href: "/publications" },
                { label: "News & Events", href: "/news" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[var(--seeder-orange)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Affiliations column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Contact &amp; Affiliations
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[var(--seeder-orange)] mt-0.5 shrink-0" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  4 Engineering Drive 3, Block E4<br />
                  Room E4-07-12, Singapore 117583
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-[var(--seeder-orange)] shrink-0" />
                <a
                  href="mailto:kelvin.xy.fong@nus.edu.sg"
                  className="text-sm text-gray-600 hover:text-[var(--seeder-orange)] transition-colors"
                >
                  kelvin.xy.fong@nus.edu.sg
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-[var(--seeder-orange)] shrink-0" />
                <a
                  href="tel:+6565166658"
                  className="text-sm text-gray-600 hover:text-[var(--seeder-orange)] transition-colors"
                >
                  +65 6516 6658
                </a>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Affiliated With</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "National University of Singapore", href: "https://www.nus.edu.sg" },
                  { label: "College of Design & Engineering", href: "https://cde.nus.edu.sg" },
                  { label: "Dept. of Electrical & Computer Engineering", href: "https://cde.nus.edu.sg/ece" },
                ].map((aff) => (
                  <a
                    key={aff.href}
                    href={aff.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[var(--seeder-orange)] transition-colors"
                  >
                    <ExternalLink size={11} />
                    {aff.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            &copy; {currentYear} SEEDER Research Group, National University of Singapore. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Application-Technology Co-Optimization of Compute-In-Memory Systems
          </p>
        </div>
      </div>
    </footer>
  );
}
