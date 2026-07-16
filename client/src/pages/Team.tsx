import { useState, useMemo, useRef } from "react";
import { Mail, Users, Filter, Search, X, Pencil, Upload, Loader2, Check, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { MEMBER_CATEGORIES } from "../../../drizzle/schema";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Category display labels ────────────────────────────────────────────────────
// Returns the section heading for a given category, taking into account
// whether we are on the alumni view (where Ph.D./M.Eng./M.Sc. get their own
// distinct headings) or the current-members view (where they collapse into
// shared headings).
function getCategoryLabel(cat: string, isAlumni: boolean): string {
  if (isAlumni) {
    const alumniLabels: Record<string, string> = {
      "Principal Investigator": "Principal Investigator",
      "Postdoctoral Fellow": "Post-doctoral Research Fellows",
      "Graduate Student (Ph.D.)": "Graduate Students (Ph.D.)",
      "Graduate Student (M.Eng.)": "Graduate Students (M.Eng.)",
      "Graduate Student (M.Sc.)": "Graduate Students (M.Sc.)",
      "Graduate Student": "Graduate Students",
      "Faculty": "Faculty",
      "Undergraduate Student": "Undergraduate Students",
      "Intern": "Interns",
      "Staff": "Research Staff",
      "Research Staff": "Research Staff",
    };
    return alumniLabels[cat] ?? cat;
  }
  const currentLabels: Record<string, string> = {
    "Principal Investigator": "Principal Investigator",
    "Postdoctoral Fellow": "Post-doctoral Research Fellows",
    "Graduate Student (Ph.D.)": "Ph.D. Students",
    "Graduate Student (M.Eng.)": "Master Students",
    "Graduate Student (M.Sc.)": "Master Students",
    "FYP Student": "FYP Students",
    "Student": "Other Students",
    "Intern": "Interns",
    "Research Staff": "Research Staff",
  };
  return currentLabels[cat] ?? cat;
}
// Legacy flat map kept for the filter-pill labels (context-free)
const CATEGORY_LABELS: Record<string, string> = {
  "Principal Investigator": "Principal Investigator",
  "Postdoctoral Fellow": "Post-doctoral Research Fellows",
  "Graduate Student (Ph.D.)": "Ph.D. Students / Graduate Students (Ph.D.)",
  "Graduate Student (M.Eng.)": "Master Students / Graduate Students (M.Eng.)",
  "Graduate Student (M.Sc.)": "Graduate Students (M.Sc.)",
  "FYP Student": "FYP Students",
  "Student": "Other Students",
  "Intern": "Interns",
  "Research Staff": "Research Staff",
  "Faculty": "Faculty",
  "Graduate Student": "Graduate Students",
  "Undergraduate Student": "Undergraduate Students",
  "Staff": "Research Staff",
};

// ── Name display helper ───────────────────────────────────────────────────
// Renders the member's name with the last name in ALL-CAPS.
// Falls back to the stored `name` field if firstName/lastName are missing.
function formatMemberName(member: { name: string; firstName?: string | null; lastName?: string | null }): string {
  if (member.firstName && member.lastName) {
    return `${member.firstName} ${member.lastName.toUpperCase()}`;
  }
  return member.name;
}

// ── Alumni category ordering ───────────────────────────────────────────────────
const ALUMNI_CATEGORY_ORDER = [
  "Faculty",
  "Postdoctoral Fellow",
  "Graduate Student (Ph.D.)",
  "Graduate Student (M.Eng.)",
  "Graduate Student (M.Sc.)",
  "Graduate Student",
  "Undergraduate Student",
  "Intern",
  "Staff",
];

type Member = {
  id: number;
  name: string;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  category: string;
  role?: string | null;
  photoUrl: string | null;
  biography: string | null;
  email: string | null;
  researchInterests: string | null;
  isAlumni: boolean;
};

// ── Edit Member Modal ──────────────────────────────────────────────────────────
interface EditMemberModalProps {
  member: Member;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditMemberModal({ member, open, onClose, onSaved }: EditMemberModalProps) {
  const [form, setForm] = useState({
    name: member.name ?? "",
    title: member.title ?? "",
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    category: member.category ?? "",
    role: member.role ?? "",
    biography: member.biography ?? "",
    email: member.email ?? "",
    researchInterests: member.researchInterests ?? "",
    photoUrl: member.photoUrl ?? "",
    isAlumni: member.isAlumni,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(member.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const uploadPhoto = trpc.team.uploadPhoto.useMutation();
  const updateMember = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
        onClose();
      }, 800);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let photoUrl = form.photoUrl;

    if (photoFile) {
      setUploading(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
        const result = await uploadPhoto.mutateAsync({
          fileName: photoFile.name,
          fileBase64: base64,
          mimeType: photoFile.type,
        });
        photoUrl = result.url;
      } finally {
        setUploading(false);
      }
    }

    updateMember.mutate({
      id: member.id,
      name: form.name || undefined,
      title: form.title || null,
      firstName: form.firstName || null,
      lastName: form.lastName || null,
      category: form.category || undefined,
      role: form.role || null,
      biography: form.biography || undefined,
      email: form.email || null,
      researchInterests: form.researchInterests || undefined,
      photoUrl: photoUrl || null,
      isAlumni: form.isAlumni,
    });
  };

  const isBusy = uploading || updateMember.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isBusy) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--seeder-navy)]">Edit Member Profile</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Photo */}
          <div className="flex items-start gap-4">
            <div
              className="w-[90px] h-[135px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 cursor-pointer relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Upload size={24} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1 block">Photo</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                <Upload size={12} className="mr-1.5" />
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); setForm(f => ({ ...f, photoUrl: "" })); }}
                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1">Recommended: 150×225 px</p>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Dr., Prof., …"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Display Name <span className="text-red-400">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full display name"
              className="text-sm"
            />
          </div>

          {/* Role & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Role</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Graduate Student (Ph.D.)"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category <span className="text-red-400">*</span></Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {[...MEMBER_CATEGORIES, "Faculty", "Graduate Student (Ph.D.)", "Graduate Student (M.Eng.)", "Graduate Student (M.Sc.)", "Graduate Student", "Undergraduate Student", "Staff"].map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs mb-1 block">Email</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
              className="text-sm"
              type="email"
            />
          </div>

          {/* Research Interests */}
          <div>
            <Label className="text-xs mb-1 block">Research Interests <span className="text-gray-400 font-normal">(comma-separated)</span></Label>
            <Input
              value={form.researchInterests}
              onChange={(e) => setForm(f => ({ ...f, researchInterests: e.target.value }))}
              placeholder="e.g. Neuromorphic Computing, MRAM, FPGA"
              className="text-sm"
            />
          </div>

          {/* Biography */}
          <div>
            <Label className="text-xs mb-1 block">Biography</Label>
            <Textarea
              value={form.biography}
              onChange={(e) => setForm(f => ({ ...f, biography: e.target.value }))}
              placeholder="Short biography…"
              className="text-sm resize-none"
              rows={5}
            />
          </div>

          {/* Alumni toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAlumni"
              checked={form.isAlumni}
              onChange={(e) => setForm(f => ({ ...f, isAlumni: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isAlumni" className="text-sm cursor-pointer">Mark as Alumni</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isBusy || !form.name || !form.category}
            className="bg-[var(--seeder-navy)] hover:bg-[var(--seeder-navy)]/90 text-white min-w-[100px]"
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : saved ? (
              <Check size={14} className="mr-1.5 text-green-400" />
            ) : null}
            {isBusy ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Biography Modal ────────────────────────────────────────────────────────────
interface BioModalProps {
  member: Member;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  isAdmin: boolean;
}

function BioModal({ member, open, onClose, onEdit, isAdmin }: BioModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--seeder-navy)] text-lg leading-tight">
            {[member.title, formatMemberName(member)].filter(Boolean).join(" ")}
          </DialogTitle>
          {member.role && (
            <p className="text-sm text-[var(--seeder-orange)] font-medium mt-0.5">{member.role}</p>
          )}
        </DialogHeader>

        <div className="flex gap-5 mt-2">
          {/* Photo */}
          {member.photoUrl && (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="object-cover rounded-lg shadow-md shrink-0"
              style={{ width: 120, height: 180 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}

          <div className="flex-1 space-y-3">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--seeder-navy)] hover:text-[var(--seeder-orange)] transition-colors"
              >
                <Mail size={13} />
                {member.email}
              </a>
            )}

            {member.researchInterests && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Research Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.researchInterests.split(",").map((interest) => (
                    <span key={interest} className="seeder-tag text-xs">
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {member.biography && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Biography</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{member.biography}</p>
          </div>
        )}

        {!member.biography && !member.researchInterests && !member.email && (
          <p className="text-sm text-gray-400 text-center py-4">No additional information available.</p>
        )}

        <DialogFooter className="mt-4 gap-2">
          {isAdmin && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil size={12} />
              Edit Profile
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────
interface MemberCardProps {
  member: Member;
  isAdmin: boolean;
}

function MemberCard({ member, isAdmin }: MemberCardProps) {
  const [bioOpen, setBioOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div
        className="seeder-card overflow-hidden group relative cursor-pointer"
        style={{ minHeight: 340 }}
        onClick={() => setBioOpen(true)}
      >
        {/* ── Main card content ── */}
        <div className="p-4 flex flex-col h-full">
          {/* Admin edit button */}
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/80 hover:bg-[var(--seeder-navy)] hover:text-white text-gray-400 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
              title="Edit member"
            >
              <Pencil size={12} />
            </button>
          )}

          <h3 className="font-semibold text-[var(--seeder-navy)] text-base leading-tight">
            {[member.title, formatMemberName(member)].filter(Boolean).join(" ")}
          </h3>
          {member.role && (
            <span className="text-xs text-[var(--seeder-orange)] font-medium mt-0.5 mb-2">
              {member.role}
            </span>
          )}
          {!member.role && <div className="mb-2" />}

          {member.researchInterests && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium mb-1">Research Interests</p>
              <div className="flex flex-wrap gap-1">
                {member.researchInterests.split(",").map((interest) => (
                  <span key={interest} className="seeder-tag text-xs">
                    {interest.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.biography && (
            <div className="mb-2">
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {member.biography}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setBioOpen(true); }}
                className="text-xs text-[var(--seeder-navy)] font-medium mt-1 hover:text-[var(--seeder-orange)] transition-colors inline-flex items-center gap-1"
              >
                <BookOpen size={11} />
                Read more
              </button>
            </div>
          )}

          {member.email && (
            <a
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--seeder-navy)] hover:text-[var(--seeder-orange)] transition-colors mt-auto pt-1"
            >
              <Mail size={12} />
              {member.email}
            </a>
          )}
        </div>

        {/* ── Photo overlay: slides in from the right on hover ── */}
        {member.photoUrl && (
          <div
            className="
              absolute inset-0
              translate-x-full group-hover:translate-x-0
              transition-transform duration-300 ease-in-out
              bg-[var(--seeder-navy)]
              flex flex-col items-center justify-center gap-3
              p-5
            "
          >
            <img
              src={member.photoUrl}
              alt={member.name}
              className="object-cover rounded-lg shadow-lg shrink-0"
              style={{ width: 150, height: 225 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="text-center">
              <p className="text-white font-semibold text-sm">
                {[member.title, formatMemberName(member)].filter(Boolean).join(" ")}
              </p>
              <p className="text-white/70 text-xs mt-0.5">{member.role || member.category}</p>
            </div>
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors"
              >
                <Mail size={11} />
                {member.email}
              </a>
            )}
            {/* Admin edit button on overlay */}
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors"
                title="Edit member"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {bioOpen && (
        <BioModal
          member={member}
          open={bioOpen}
          onClose={() => setBioOpen(false)}
          onEdit={isAdmin ? () => { setBioOpen(false); setEditOpen(true); } : undefined}
          isAdmin={isAdmin}
        />
      )}

      {editOpen && (
        <EditMemberModal
          member={member}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

const ALL_FILTER = "All";

export default function Team() {
  const [showAlumni, setShowAlumni] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: currentMembers, isLoading: loadingCurrent } = trpc.team.list.useQuery({
    isAlumni: false,
  });
  const { data: alumni, isLoading: loadingAlumni } = trpc.team.list.useQuery({
    isAlumni: true,
  });

  const allMembers = showAlumni ? alumni : currentMembers;
  const isLoading = showAlumni ? loadingAlumni : loadingCurrent;

  // Category ordering: current members use MEMBER_CATEGORIES, alumni use ALUMNI_CATEGORY_ORDER
  const categoryOrder = showAlumni ? ALUMNI_CATEGORY_ORDER : (MEMBER_CATEGORIES as readonly string[]);

  // Categories present in the current dataset, in canonical order
  const presentCategories = useMemo(
    () => categoryOrder.filter((cat) => allMembers?.some((m) => m.category === cat)),
    [allMembers, categoryOrder]
  );

  // Apply search + category filter
  const filteredMembers = useMemo(() => {
    if (!allMembers) return [];
    const q = search.toLowerCase();
    return allMembers.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.researchInterests ?? "").toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === ALL_FILTER || m.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allMembers, search, categoryFilter]);

  // Group filtered members by category, preserving canonical order.
  // For current members, Graduate Student (M.Sc.) and Graduate Student (M.Eng.) are
  // merged into a single "Master Students" bucket displayed under the M.Eng. key.
  const MASTER_CATS = new Set(["Graduate Student (M.Sc.)", "Graduate Student (M.Eng.)"]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filteredMembers> = {};
    for (const cat of categoryOrder) {
      // For current members, merge both master categories under Graduate Student (M.Eng.)
      if (!showAlumni && cat === "Graduate Student (M.Sc.)") continue; // handled by M.Eng. bucket
      const group = !showAlumni && cat === "Graduate Student (M.Eng.)"
        ? filteredMembers.filter((m) => MASTER_CATS.has(m.category))
        : filteredMembers.filter((m) => m.category === cat);
      if (group.length > 0) map[cat] = [...group].sort((a, b) =>
        (a.lastName ?? a.name ?? "").localeCompare(b.lastName ?? b.name ?? "")
      );
    }
    // Bucket members whose category doesn't match any canonical value
    const unknownGroup = filteredMembers.filter(
      (m) => !categoryOrder.includes(m.category) && (showAlumni || !MASTER_CATS.has(m.category))
    );
    if (unknownGroup.length > 0) map["Other"] = [...unknownGroup].sort((a, b) =>
      (a.lastName ?? a.name ?? "").localeCompare(b.lastName ?? b.name ?? "")
    );
    return map;
  }, [filteredMembers, categoryOrder, showAlumni]);

  // Reset filter when switching between current/alumni
  const handleToggle = (isAlumni: boolean) => {
    setShowAlumni(isAlumni);
    setCategoryFilter(ALL_FILTER);
    setSearch("");
  };

  const groupKeys = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...(grouped["Other"] ? ["Other"] : []),
  ];

  return (
    <Layout>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold seeder-section-header mb-3">Our Team</h1>
          <div className="seeder-divider" />
          <p className="text-gray-600 max-w-xl text-base leading-relaxed">
            Meet the researchers and students who make up the SEEDER Group at the National
            University of Singapore.
          </p>
        </div>
      </section>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
        <div className="container py-3 flex flex-wrap items-center gap-3">
          {/* Current / Alumni toggle */}
          <div className="flex gap-1 shrink-0 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleToggle(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !showAlumni
                  ? "bg-[var(--seeder-navy)] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Current Members
            </button>
            <button
              onClick={() => handleToggle(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showAlumni
                  ? "bg-[var(--seeder-navy)] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Alumni
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name or interest…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--seeder-navy)]/20 focus:border-[var(--seeder-navy)] transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          {presentCategories.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-gray-400 shrink-0" />
              <button
                onClick={() => setCategoryFilter(ALL_FILTER)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === ALL_FILTER
                    ? "bg-[var(--seeder-orange)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {presentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-[var(--seeder-orange)] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {getCategoryLabel(cat, showAlumni)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Members Grid ─────────────────────────────────────────────────── */}
      <section className="section-padding bg-[var(--seeder-gray-light)]">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="seeder-card p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : groupKeys.length > 0 ? (
            <div className="space-y-12">
              {groupKeys.map((cat, idx) => {
                const group = grouped[cat];
                if (!group || group.length === 0) return null;
                const label = getCategoryLabel(cat, showAlumni);
                return (
                  <div key={cat}>
                    {/* Category separator */}
                    {idx > 0 && (
                      <hr className="border-t border-gray-200 mb-10 -mt-2" />
                    )}
                    <h2 className="text-xl font-bold seeder-section-header mb-2">{label}</h2>
                    <div className="seeder-divider mb-5" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.map((member) => (
                        <MemberCard key={member.id} member={member} isAdmin={isAdmin} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                {search || categoryFilter !== ALL_FILTER
                  ? "No members match your search."
                  : showAlumni
                  ? "No alumni listed yet."
                  : "Team members will appear here once added."}
              </p>
              {(search || categoryFilter !== ALL_FILTER) && (
                <button
                  onClick={() => { setSearch(""); setCategoryFilter(ALL_FILTER); }}
                  className="mt-3 text-xs text-[var(--seeder-navy)] hover:text-[var(--seeder-orange)] transition-colors font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
