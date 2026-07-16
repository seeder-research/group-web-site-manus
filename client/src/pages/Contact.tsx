import { useState } from "react";
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

export default function Contact() {
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm({ senderName: "", senderEmail: "", subject: "", message: "" });
    },
    onError: (err) => {
      setError(err.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.senderName || !form.senderEmail || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    submitMutation.mutate(form);
  };

  const affiliates = [
    {
      name: "National University of Singapore",
      url: "https://www.nus.edu.sg",
      desc: "Singapore's flagship university",
    },
    {
      name: "College of Design & Engineering",
      url: "https://cde.nus.edu.sg",
      desc: "NUS CDE",
    },
    {
      name: "Dept. of Electrical & Computer Engineering",
      url: "https://cde.nus.edu.sg/ece",
      desc: "NUS ECE Department",
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold seeder-section-header mb-3">Contact Us</h1>
          <div className="seeder-divider" />
          <p className="text-gray-600 max-w-xl text-base leading-relaxed">
            We welcome inquiries from prospective students, academic collaborators, and industry
            partners. Get in touch with the SEEDER Group.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[var(--seeder-gray-light)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Direct contact */}
              <div className="seeder-card p-6">
                <h2 className="text-lg font-bold seeder-section-header mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(26,39,68,0.07)] flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-[var(--seeder-navy)]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <a
                        href="mailto:kelvin.xy.fong@nus.edu.sg"
                        className="text-sm text-[var(--seeder-navy)] hover:text-[var(--seeder-orange)] transition-colors font-medium"
                      >
                        kelvin.xy.fong@nus.edu.sg
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(26,39,68,0.07)] flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-[var(--seeder-navy)]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <a
                        href="tel:+6565166658"
                        className="text-sm text-[var(--seeder-navy)] hover:text-[var(--seeder-orange)] transition-colors font-medium"
                      >
                        +65 6516 6658
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(26,39,68,0.07)] flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-[var(--seeder-navy)]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Address</p>
                      <address className="text-sm text-gray-700 not-italic leading-relaxed">
                        4 Engineering Drive 3<br />
                        Block E4, Room E4-07-12<br />
                        Singapore 117583
                      </address>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affiliations */}
              <div className="seeder-card p-6">
                <h2 className="text-lg font-bold seeder-section-header mb-4">Affiliations</h2>
                <div className="space-y-3">
                  {affiliates.map((aff) => (
                    <a
                      key={aff.url}
                      href={aff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 group"
                    >
                      <ExternalLink
                        size={14}
                        className="text-[var(--seeder-orange)] mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--seeder-navy)] group-hover:text-[var(--seeder-orange)] transition-colors leading-tight">
                          {aff.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{aff.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="seeder-card p-6">
                <h2 className="text-lg font-bold seeder-section-header mb-1">Send a Message</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Fill out the form below and we will get back to you as soon as possible.
                </p>

                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle size={48} className="text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--seeder-navy)] mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Thank you for reaching out. We will respond to your inquiry shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-sm text-[var(--seeder-navy)] font-medium hover:text-[var(--seeder-orange)] transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.senderName}
                          onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                          placeholder="Your name"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.senderEmail}
                          onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="What is this regarding?"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Write your message here..."
                        rows={6}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)] resize-none"
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--seeder-navy)] hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                    >
                      {submitMutation.isPending ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send size={15} /> Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
