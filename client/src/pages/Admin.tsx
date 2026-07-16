import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Users, BookOpen, Layers, Newspaper, Mail, Plus, Pencil, Trash2,
  Search, Upload, X, ChevronDown, ChevronUp, LogIn, Shield,
  FileUp, AlertTriangle, CheckSquare, Square, Loader2
} from "lucide-react";
import { MEMBER_CATEGORIES } from "../../../drizzle/schema";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Team Member Form ─────────────────────────────────────────────────────────
function TeamMemberForm({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    title: initial?.title ?? "",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    category: initial?.category ?? MEMBER_CATEGORIES[0],
    role: initial?.role ?? "",
    isAlumni: initial?.isAlumni ?? false,
    biography: initial?.biography ?? "",
    email: initial?.email ?? "",
    researchInterests: initial?.researchInterests ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    photoUrl: initial?.photoUrl ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const combinedRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = trpc.team.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, photoUrl: data.url }));
      toast.success("Photo uploaded");
    },
    onError: () => toast.error("Photo upload failed"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      await uploadPhoto.mutateAsync({ fileName: file.name, fileBase64, mimeType: file.type });
    } finally {
      setUploading(false);
    }
  };

  // ── JSON template download ─────────────────────────────────────────────────
  const downloadJsonTemplate = () => {
    const template = {
      full_name: "",
      first_name: "",
      last_name: "",
      honorific: "",
      email: "",
      position: "",
      biography: "",
      research_interests: []
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team_member_template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── JSON import: parse and populate form fields ─────────────────────────────
  const applyJsonData = (data: Record<string, any>) => {
    const fullName = data.full_name ?? data.name ?? "";
    const firstName = data.first_name ?? data.firstName ?? (fullName.split(" ")[0] ?? "");
    const lastName = data.last_name ?? data.lastName ?? (fullName.split(" ").slice(1).join(" ") ?? "");
    setForm((f) => ({
      ...f,
      name: fullName || f.name,
      firstName: firstName || f.firstName,
      lastName: lastName || f.lastName,
      title: data.title ?? data.honorific ?? f.title,
      email: data.email ?? f.email,
      role: data.position ?? data.role ?? f.role,
      biography: data.biography ?? data.bio ?? f.biography,
      researchInterests: Array.isArray(data.research_interests)
        ? data.research_interests.join(", ")
        : (data.researchInterests ?? data.research_interests ?? f.researchInterests),
    }));
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonLoading(true);
    try {
      const text = await file.text();
      applyJsonData(JSON.parse(text));
      toast.success("JSON imported — review fields below");
    } catch {
      toast.error("Failed to parse JSON file");
    } finally {
      setJsonLoading(false);
      e.target.value = "";
    }
  };

  const handleCombinedImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const jsonFile = files.find((f) => f.name.endsWith(".json"));
    const photoFile = files.find((f) => f.type.startsWith("image/"));
    if (jsonFile) {
      setJsonLoading(true);
      try {
        const text = await jsonFile.text();
        applyJsonData(JSON.parse(text));
        toast.success("JSON imported");
      } catch { toast.error("Failed to parse JSON"); }
      finally { setJsonLoading(false); }
    }
    if (photoFile) {
      setUploading(true);
      try {
        const fileBase64 = await fileToBase64(photoFile);
        await uploadPhoto.mutateAsync({ fileName: photoFile.name, fileBase64, mimeType: photoFile.type });
      } finally { setUploading(false); }
    }
    e.target.value = "";
  };

  const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%23e8eaed'/%3E%3Ccircle cx='50' cy='55' r='22' fill='%23b0b8c8'/%3E%3Cellipse cx='50' cy='130' rx='35' ry='28' fill='%23b0b8c8'/%3E%3C/svg%3E";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      {/* ── Quick Import strip ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <span className="text-xs font-semibold text-blue-700 shrink-0">Quick Import:</span>
        <button
          type="button"
          onClick={() => jsonRef.current?.click()}
          disabled={jsonLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          <FileUp size={12} /> {jsonLoading ? "Parsing..." : "Import JSON"}
        </button>
        <button
          type="button"
          onClick={() => combinedRef.current?.click()}
          disabled={uploading || jsonLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          <Upload size={12} /> {uploading ? "Uploading..." : "Import JSON + Photo"}
        </button>
        <button
          type="button"
          onClick={downloadJsonTemplate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
        >
          <FileUp size={12} className="rotate-180" /> Download Template
        </button>
        <span className="text-xs text-blue-500">JSON auto-fills fields; select both files together for combined import</span>
        <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={handleJsonImport} />
        <input ref={combinedRef} type="file" accept=".json,application/json,image/*" multiple className="hidden" onChange={handleCombinedImport} />
      </div>
      {/* Row 1: Title + First Name + Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Dr., Prof., Mr., Ms." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
          <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
          <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
        </div>
      </div>
      {/* Row 2: Display Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Name *</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name as displayed" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@nus.edu.sg" />
        </div>
      </div>
      {/* Row 3: Category + Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
          <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MEMBER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <input className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Graduate Student (PhD)" />
        </div>
      </div>
      {/* Row 4: Display Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
          <input className="form-input" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Research Interests (comma-separated)</label>
        <input className="form-input" value={form.researchInterests} onChange={(e) => setForm({ ...form, researchInterests: e.target.value })} placeholder="CIM, RRAM, Edge AI" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Biography</label>
        <textarea className="form-input resize-none" rows={4} value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} placeholder="Short biography..." />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Photo (150×225px)</label>
        <div className="flex items-start gap-4">
          <img src={form.photoUrl || PLACEHOLDER} alt="Preview" className="w-[150px] h-[225px] object-cover rounded-lg border border-gray-200 bg-gray-100" />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[var(--seeder-navy)] text-white rounded-lg hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 transition-colors"
            >
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            {form.photoUrl && (
              <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className="text-xs text-red-400 hover:text-red-600">Remove photo</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="isAlumni" checked={form.isAlumni} onChange={(e) => setForm({ ...form, isAlumni: e.target.checked })} className="rounded" />
        <label htmlFor="isAlumni" className="text-sm text-gray-600">Mark as Alumni</label>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(form)} className="px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
          {initial ? "Update Member" : "Add Member"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Publication Form ─────────────────────────────────────────────────────────
function PublicationForm({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"doi" | "bibtex" | "manual">("doi");
  const [doiInput, setDoiInput] = useState("");
  const [bibtexInput, setBibtexInput] = useState("");
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    authors: initial?.authors ?? "",
    year: initial?.year ?? "",
    publicationDate: initial?.publicationDate ?? "",
    journal: initial?.journal ?? "",
    pages: initial?.pages ?? "",
    doi: initial?.doi ?? "",
    url: initial?.url ?? "",
    relatedProjects: initial?.relatedProjects ?? "",
    pubType: initial?.pubType ?? "journal",
    bibtex: initial?.bibtex ?? "",
    abstract: initial?.abstract ?? "",
  });

  const lookupDoi = trpc.publications.lookupDoi.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({
        ...f,
        title: data.title ?? "",
        authors: data.authors ?? "",
        year: data.year ? String(data.year) : "",
        publicationDate: data.publicationDate ?? "",
        journal: data.journal ?? "",
        pages: data.pages ?? "",
        doi: data.doi ?? "",
        url: data.link ?? "",
        abstract: data.abstract ?? "",
      }));
      toast.success("Metadata fetched from CrossRef");
    },
    onError: (e) => toast.error(e.message),
  });

  const parseBibtex = trpc.publications.parseBibtex.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({
        ...f,
        title: data.title ?? "",
        authors: data.authors ?? "",
        year: data.year ? String(data.year) : "",
        publicationDate: data.publicationDate ?? "",
        journal: data.journal ?? "",
        pages: data.pages ?? "",
        doi: data.doi ?? "",
        url: data.link ?? "",
        bibtex: bibtexInput,
        abstract: data.abstract ?? "",
      }));
      toast.success("BibTeX parsed successfully");
    },
    onError: () => toast.error("Failed to parse BibTeX"),
  });

  const handleSave = () => {
    onSave({ ...form, year: form.year ? parseInt(form.year) : null });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
        {(["doi", "bibtex", "manual"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${mode === m ? "bg-white text-[var(--seeder-navy)] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {m === "doi" ? "DOI Lookup" : m === "bibtex" ? "BibTeX" : "Manual Entry"}
          </button>
        ))}
      </div>

      {mode === "doi" && (
        <div className="flex gap-2">
          <input className="form-input flex-1" value={doiInput} onChange={(e) => setDoiInput(e.target.value)} placeholder="10.1109/ISSCC.2024.xxxxx or https://doi.org/..." />
          <button
            onClick={() => lookupDoi.mutate({ doi: doiInput })}
            disabled={!doiInput || lookupDoi.isPending}
            className="px-4 py-2 bg-[var(--seeder-orange)] text-white text-xs font-medium rounded-lg hover:bg-[var(--seeder-orange-light)] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {lookupDoi.isPending ? "Looking up..." : "Fetch Metadata"}
          </button>
        </div>
      )}

      {mode === "bibtex" && (
        <div className="space-y-2">
          <textarea className="form-input resize-none font-mono text-xs" rows={6} value={bibtexInput} onChange={(e) => setBibtexInput(e.target.value)} placeholder="@article{key,&#10;  title={...},&#10;  author={...},&#10;  ...&#10;}" />
          <button
            onClick={() => parseBibtex.mutate({ bibtex: bibtexInput })}
            disabled={!bibtexInput || parseBibtex.isPending}
            className="px-4 py-2 bg-[var(--seeder-orange)] text-white text-xs font-medium rounded-lg hover:bg-[var(--seeder-orange-light)] disabled:opacity-60 transition-colors"
          >
            {parseBibtex.isPending ? "Parsing..." : "Parse BibTeX"}
          </button>
        </div>
      )}

      {/* Manual fields (always shown, pre-filled by DOI/BibTeX) */}
      <div className="space-y-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-400 font-medium">Publication Details</p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Publication title" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Authors *</label>
          <input className="form-input" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Author 1, Author 2, ..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <input className="form-input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Pages / Article No.</label>
            <input className="form-input" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="1-4 or e12345" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Journal / Conference</label>
          <input className="form-input" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} placeholder="IEEE ISSCC, Nature Electronics, ..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Publication Type</label>
          <select className="form-input" value={form.pubType} onChange={(e) => setForm({ ...form, pubType: e.target.value })}>
            <option value="journal">Journal Article</option>
            <option value="conference">Conference Paper</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">DOI</label>
            <input className="form-input" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} placeholder="10.xxxx/xxxxx" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Custom URL <span className="font-normal text-gray-400">(overrides DOI link)</span></label>
            <input className="form-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Related Projects</label>
          <input className="form-input" value={form.relatedProjects} onChange={(e) => setForm({ ...form, relatedProjects: e.target.value })} placeholder="project-slug-1, project-slug-2" />
          <p className="text-[10px] text-gray-400 mt-1">Comma-separated project slugs (e.g. compute-in-memory)</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Abstract</label>
          <textarea className="form-input resize-none" rows={3} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} placeholder="Abstract text..." />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className="px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
          {initial ? "Update Publication" : "Add Publication"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Bulk .bib File Upload Panel ─────────────────────────────────────────────
function BibFileUploadPanel() {
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isParsed, setIsParsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const parseBibFile = trpc.publications.parseBibFile.useMutation({
    onSuccess: (data) => {
      setPreview(data.entries);
      setSelected(new Set(data.entries.map((_: any, i: number) => i)));
      setIsParsed(true);
      toast.success(`Found ${data.count} entries in ${fileName}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkCreate = trpc.publications.bulkCreate.useMutation({
    onSuccess: (data) => {
      utils.publications.list.invalidate();
      toast.success(`Imported ${data.inserted} publications${data.skipped > 0 ? `, ${data.skipped} skipped` : ""}`);
      setPreview([]); setFileContent(""); setFileName(""); setIsParsed(false); setSelected(new Set());
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const toggleSelect = (i: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  const toggleAll = () => setSelected(selected.size === preview.length ? new Set() : new Set(preview.map((_: any, i: number) => i)));

  const handleImport = () => {
    const toImport = preview.filter((_: any, i: number) => selected.has(i)).map((e: any) => ({
      title: e.title,
      authors: e.authors,
      year: e.year,
      publicationDate: e.publicationDate,
      journal: e.journal,
      pages: e.pages,
      doi: e.doi,
      url: e.link,
      pubType: e.pubType,
      abstract: e.abstract,
    }));
    bulkCreate.mutate(toImport);
  };

  const PUB_TYPE_LABELS: Record<string, string> = {
    journal: "Journal", conference: "Conference", book: "Book",
    "book-chapter": "Book Ch.", thesis: "Thesis", "technical-report": "Tech. Report",
    preprint: "Preprint", patent: "Patent", other: "Other",
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Upload a <code className="bg-blue-100 px-1 rounded">.bib</code> file containing one or more BibTeX entries. All entry types are supported (@article, @inproceedings, @book, @phdthesis, etc.). Review the parsed entries before confirming the import.
      </div>

      {/* File picker */}
      <div className="flex items-center gap-3">
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
          <FileUp size={15} /> {fileName ? `Change file` : "Choose .bib file"}
        </button>
        {fileName && <span className="text-sm text-gray-600 font-mono">{fileName}</span>}
        <input ref={fileRef} type="file" accept=".bib,.txt" className="hidden" onChange={handleFileChange} />
      </div>

      {fileContent && !isParsed && (
        <button onClick={() => parseBibFile.mutate({ content: fileContent })} disabled={parseBibFile.isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-orange)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-orange-light)] disabled:opacity-60 transition-colors">
          {parseBibFile.isPending ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : "Parse File"}
        </button>
      )}

      {/* Preview table */}
      {isParsed && preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--seeder-navy)]">{preview.length} entries found — {selected.size} selected for import</p>
            <button onClick={toggleAll} className="text-xs text-[var(--seeder-orange)] hover:underline">{selected.size === preview.length ? "Deselect all" : "Select all"}</button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {preview.map((entry: any, i: number) => (
              <div key={i} onClick={() => toggleSelect(i)} className={`seeder-card p-3 cursor-pointer flex items-start gap-3 transition-colors ${selected.has(i) ? "border-[var(--seeder-orange)] bg-orange-50" : "opacity-60"}`}>
                <div className="mt-0.5 shrink-0">{selected.has(i) ? <CheckSquare size={16} className="text-[var(--seeder-orange)]" /> : <Square size={16} className="text-gray-300" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--seeder-navy)] leading-snug">{entry.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{entry.authors?.slice(0, 80)}{(entry.authors?.length ?? 0) > 80 ? "..." : ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.journal && <span className="text-xs text-gray-400 italic">{entry.journal?.slice(0, 50)}</span>}
                    {entry.year && <span className="seeder-tag-orange text-xs">{entry.year}</span>}
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{PUB_TYPE_LABELS[entry.pubType] ?? entry.pubType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleImport} disabled={selected.size === 0 || bulkCreate.isPending} className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 transition-colors">
              {bulkCreate.isPending ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : `Import ${selected.size} selected`}
            </button>
            <button onClick={() => { setIsParsed(false); setPreview([]); setFileContent(""); setFileName(""); setSelected(new Set()); }} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Duplicate Detection Panel ────────────────────────────────────────────────
function DuplicatesPanel() {
  const [hasSearched, setHasSearched] = useState(false);
  const [toDelete, setToDelete] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils();

  const { data: groups, refetch, isFetching } = trpc.publications.findDuplicates.useQuery(undefined, {
    enabled: false,
  });

  const deleteMany = trpc.publications.deleteMany.useMutation({
    onSuccess: (data) => {
      utils.publications.list.invalidate();
      setToDelete(new Set());
      refetch();
      toast.success(`Deleted ${data.deleted} publication${data.deleted !== 1 ? "s" : ""}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSearch = async () => {
    await refetch();
    setHasSearched(true);
  };

  const toggleDelete = (id: number) => setToDelete((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDeleteSelected = () => {
    if (toDelete.size === 0) return;
    if (!confirm(`Delete ${toDelete.size} selected publication${toDelete.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    deleteMany.mutate({ ids: Array.from(toDelete) });
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>This tool scans the database for publications with the same <strong>DOI</strong> or matching <strong>title</strong>. Review each group and select entries to delete. Deletions are permanent.</span>
      </div>

      <button onClick={handleSearch} disabled={isFetching} className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 transition-colors">
        {isFetching ? <><Loader2 size={14} className="animate-spin" /> Scanning...</> : "Scan for Duplicates"}
      </button>

      {hasSearched && groups !== undefined && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckSquare size={32} className="mx-auto mb-2 text-green-400" />
              <p className="text-sm">No duplicates found. Your database is clean!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--seeder-navy)]">{groups.length} duplicate group{groups.length !== 1 ? "s" : ""} found</p>
                {toDelete.size > 0 && (
                  <button onClick={handleDeleteSelected} disabled={deleteMany.isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                    {deleteMany.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete {toDelete.size} selected
                  </button>
                )}
              </div>
              {groups.map((group: any, gi: number) => (
                <div key={gi} className="border border-amber-200 rounded-xl overflow-hidden">
                  <div className="bg-amber-50 px-4 py-2 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500" />
                    <span className="text-xs font-medium text-amber-700">Duplicate by {group.type === "doi" ? "DOI" : "title"} · {group.entries.length} entries</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {group.entries.map((pub: any) => (
                      <div key={pub.id} onClick={() => toggleDelete(pub.id)} className={`p-3 cursor-pointer flex items-start gap-3 transition-colors hover:bg-gray-50 ${toDelete.has(pub.id) ? "bg-red-50" : ""}`}>
                        <div className="mt-0.5 shrink-0">{toDelete.has(pub.id) ? <CheckSquare size={16} className="text-red-500" /> : <Square size={16} className="text-gray-300" />}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--seeder-navy)] leading-snug">{pub.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pub.authors?.slice(0, 80)}{(pub.authors?.length ?? 0) > 80 ? "..." : ""}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {pub.year && <span className="seeder-tag-orange text-xs">{pub.year}</span>}
                            {pub.doi && <span className="text-xs text-gray-400 font-mono">{pub.doi}</span>}
                            <span className="text-xs text-gray-400">ID: {pub.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Research Project Form ────────────────────────────────────────────────────
function ResearchProjectForm({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    fullContent: initial?.fullContent ?? "",
    imageUrl: initial?.imageUrl ?? "",
    tags: initial?.tags ?? "",
    isActive: initial?.isActive ?? true,
    displayOrder: initial?.displayOrder ?? 0,
  });
  const [gallery, setGallery] = useState<{ url: string; caption: string }[]>(
    initial?.galleryImages ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState<number | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const uploadImage = trpc.research.uploadImage.useMutation({
    onSuccess: (data) => { setForm((f) => ({ ...f, imageUrl: data.url })); toast.success("Hero image uploaded"); },
    onError: () => toast.error("Image upload failed"),
  });

  const uploadGalleryImage = trpc.research.uploadImage.useMutation({
    onError: () => toast.error("Gallery image upload failed"),
  });

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      await uploadImage.mutateAsync({ fileName: file.name, fileBase64, mimeType: file.type });
    } finally { setUploading(false); }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    for (const file of files) {
      const idx = gallery.length;
      setGalleryUploading(idx);
      try {
        const fileBase64 = await fileToBase64(file);
        const { url } = await uploadGalleryImage.mutateAsync({ fileName: file.name, fileBase64, mimeType: file.type });
        setGallery((g) => [...g, { url, caption: "" }]);
        toast.success(`Gallery image uploaded`);
      } catch { /* already toasted */ } finally {
        setGalleryUploading(null);
      }
    }
    e.target.value = "";
  };

  const updateCaption = (idx: number, caption: string) =>
    setGallery((g) => g.map((item, i) => i === idx ? { ...item, caption } : item));

  const removeGalleryItem = (idx: number) =>
    setGallery((g) => g.filter((_, i) => i !== idx));

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: initial ? form.slug : autoSlug(e.target.value) })} placeholder="Project title" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL Slug *</label>
          <input className="form-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="project-url-slug" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
        <textarea className="form-input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description for the project card..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Full Content</label>
        <textarea className="form-input resize-none" rows={6} value={form.fullContent} onChange={(e) => setForm({ ...form, fullContent: e.target.value })} placeholder="Full project description, methodology, results..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
        <input className="form-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="CIM, RRAM, Edge AI" />
      </div>

      {/* Hero Image (square) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Hero Image <span className="font-normal text-gray-400">(square thumbnail shown on project card)</span></label>
        <div className="flex items-start gap-4">
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Hero preview"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
          )}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => heroFileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[var(--seeder-navy)] text-white rounded-lg hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 transition-colors">
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload Hero Image"}
            </button>
            {form.imageUrl && (
              <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            )}
            <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleHeroFileChange} />
          </div>
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Gallery Images <span className="font-normal text-gray-400">(displayed on project page with lightbox)</span></label>
        <div className="space-y-3">
          {gallery.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <img src={item.url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-500 mb-1">Caption (optional)</label>
                <input
                  className="form-input text-xs"
                  value={item.caption}
                  onChange={(e) => updateCaption(idx, e.target.value)}
                  placeholder="Describe this image..."
                />
              </div>
              <button type="button" onClick={() => removeGalleryItem(idx)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
                <X size={15} />
              </button>
            </div>
          ))}
          {galleryUploading !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 size={13} className="animate-spin" /> Uploading image...
            </div>
          )}
          <button type="button" onClick={() => galleryFileRef.current?.click()}
            disabled={galleryUploading !== null}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-[var(--seeder-navy)] hover:text-[var(--seeder-navy)] disabled:opacity-60 transition-colors">
            <Plus size={13} /> Add Gallery Image
          </button>
          <input ref={galleryFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFileChange} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
          <label htmlFor="isActive" className="text-sm text-gray-600">Active / Visible</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Order:</label>
          <input className="form-input w-20" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave({ ...form, galleryImages: gallery })} className="px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
          {initial ? "Update Project" : "Add Project"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── News Post Form ───────────────────────────────────────────────────────────
function NewsPostForm({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    imageUrl: initial?.imageUrl ?? "",
    externalLink: initial?.externalLink ?? "",
    externalLinkLabel: initial?.externalLinkLabel ?? "",
    postType: initial?.postType ?? "general",
    timezone: initial?.timezone ?? "Asia/Singapore",
    publishedAt: initial?.publishedAt
      ? new Date(initial.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = trpc.news.uploadImage.useMutation({
    onSuccess: (data) => { setForm((f) => ({ ...f, imageUrl: data.url })); toast.success("Image uploaded"); },
    onError: () => toast.error("Image upload failed"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      await uploadImage.mutateAsync({ fileName: file.name, fileBase64, mimeType: file.type });
    } finally { setUploading(false); }
  };

  const handleSave = () => {
    onSave({ ...form, publishedAt: new Date(form.publishedAt) });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
        <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select className="form-input" value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value })}>
            {["general", "conference", "workshop", "social", "award"].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date &amp; Time</label>
          <input className="form-input" type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
          <select className="form-input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {["Asia/Singapore", "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Content *</label>
        <textarea className="form-input resize-none" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe the event or news..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">External Link (optional)</label>
          <input className="form-input" value={form.externalLink} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Link Label</label>
          <input className="form-input" value={form.externalLinkLabel} onChange={(e) => setForm({ ...form, externalLinkLabel: e.target.value })} placeholder="Event website" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Image (optional)</label>
        <div className="flex items-start gap-4">
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-gray-200" />}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[var(--seeder-navy)] text-white rounded-lg hover:bg-[var(--seeder-navy-light)] disabled:opacity-60 transition-colors">
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload Image"}
            </button>
            {form.imageUrl && <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className="px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
          {initial ? "Update Post" : "Publish Post"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Publications Tab Panel (sub-tabbed) ──────────────────────────────────────────
function PublicationsTabPanel({ publications, showForm, editItem, onAdd, onEdit, onDelete, onSave, onCancel }: {
  publications: any[];
  showForm: boolean;
  editItem: any;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [subTab, setSubTab] = useState<"list" | "bulk" | "duplicates">("list");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold seeder-section-header">Publications</h2>
        {subTab === "list" && !showForm && (
          <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
            <Plus size={15} /> Add Publication
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {(["list", "bulk", "duplicates"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === t ? "bg-white text-[var(--seeder-navy)] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
            {t === "list" ? "Add / Edit" : t === "bulk" ? "Bulk Import (.bib)" : "Find Duplicates"}
          </button>
        ))}
      </div>

      {/* Add / Edit sub-tab */}
      {subTab === "list" && (
        <div>
          {showForm && (
            <div className="mb-6">
              <PublicationForm initial={editItem} onSave={onSave} onCancel={onCancel} />
            </div>
          )}
          <div className="space-y-2">
            {publications.map((p) => (
              <div key={p.id} className="seeder-card p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--seeder-navy)] text-sm leading-snug">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.authors?.slice(0, 80)}{(p.authors?.length ?? 0) > 80 ? "..." : ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.journal && <span className="text-xs text-gray-500 italic">{p.journal}</span>}
                    {p.year && <span className="seeder-tag-orange text-xs">{p.year}</span>}
                    {p.pubType && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">{p.pubType}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onEdit(p)} className="p-2 text-gray-400 hover:text-[var(--seeder-navy)] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => onDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {publications.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No publications yet. Add your first publication above.</p>}
          </div>
        </div>
      )}

      {/* Bulk Import sub-tab */}
      {subTab === "bulk" && <BibFileUploadPanel />}

      {/* Find Duplicates sub-tab */}
      {subTab === "duplicates" && <DuplicatesPanel />}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
type AdminTab = "team" | "publications" | "research" | "news" | "messages";

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("team");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const utils = trpc.useUtils();

  // Team
  const { data: currentMembers } = trpc.team.list.useQuery({ isAlumni: false });
  const { data: alumniMembers } = trpc.team.list.useQuery({ isAlumni: true });
  const createMember = trpc.team.create.useMutation({ onSuccess: () => { utils.team.list.invalidate(); toast.success("Member added"); setShowForm(false); } });
  const updateMember = trpc.team.update.useMutation({ onSuccess: () => { utils.team.list.invalidate(); toast.success("Member updated"); setShowForm(false); setEditItem(null); } });
  const deleteMember = trpc.team.delete.useMutation({ onSuccess: () => { utils.team.list.invalidate(); toast.success("Member removed"); } });

  // Publications
  const { data: publications } = trpc.publications.list.useQuery();
  const createPub = trpc.publications.create.useMutation({ onSuccess: () => { utils.publications.list.invalidate(); toast.success("Publication added"); setShowForm(false); } });
  const updatePub = trpc.publications.update.useMutation({ onSuccess: () => { utils.publications.list.invalidate(); toast.success("Publication updated"); setShowForm(false); setEditItem(null); } });
  const deletePub = trpc.publications.delete.useMutation({ onSuccess: () => { utils.publications.list.invalidate(); toast.success("Publication removed"); } });

  // Research
  const { data: projects } = trpc.research.list.useQuery({ activeOnly: false });
  const createProject = trpc.research.create.useMutation({ onSuccess: () => { utils.research.list.invalidate(); toast.success("Project added"); setShowForm(false); } });
  const updateProject = trpc.research.update.useMutation({ onSuccess: () => { utils.research.list.invalidate(); toast.success("Project updated"); setShowForm(false); setEditItem(null); } });
  const deleteProject = trpc.research.delete.useMutation({ onSuccess: () => { utils.research.list.invalidate(); toast.success("Project removed"); } });

  // News
  const { data: newsPosts } = trpc.news.list.useQuery({});
  const createPost = trpc.news.create.useMutation({ onSuccess: () => { utils.news.list.invalidate(); toast.success("Post published"); setShowForm(false); } });
  const updatePost = trpc.news.update.useMutation({ onSuccess: () => { utils.news.list.invalidate(); toast.success("Post updated"); setShowForm(false); setEditItem(null); } });
  const deletePost = trpc.news.delete.useMutation({ onSuccess: () => { utils.news.list.invalidate(); toast.success("Post removed"); } });

  // Messages
  const { data: messages } = trpc.contact.list.useQuery(undefined as never, { enabled: isAuthenticated && user?.role === "admin" });
  const markRead = trpc.contact.markRead.useMutation({ onSuccess: () => utils.contact.list.invalidate() });

  if (loading) return <Layout><div className="container py-20 text-center text-gray-400">Loading...</div></Layout>;

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Shield size={48} className="mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-semibold text-[var(--seeder-navy)] mb-2">Admin Access Required</h2>
          <p className="text-gray-500 text-sm mb-6">Please sign in to access the admin panel.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-[var(--seeder-navy)] text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-[var(--seeder-navy-light)] transition-colors">
            <LogIn size={16} /> Sign In
          </a>
        </div>
      </Layout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Shield size={48} className="mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-semibold text-[var(--seeder-navy)] mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">You do not have admin privileges.</p>
        </div>
      </Layout>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "team", label: "Team", icon: <Users size={15} />, count: (currentMembers?.length ?? 0) + (alumniMembers?.length ?? 0) },
    { id: "publications", label: "Publications", icon: <BookOpen size={15} />, count: publications?.length },
    { id: "research", label: "Research", icon: <Layers size={15} />, count: projects?.length },
    { id: "news", label: "News", icon: <Newspaper size={15} />, count: newsPosts?.length },
    { id: "messages", label: "Messages", icon: <Mail size={15} />, count: messages?.filter((m) => !m.isRead).length },
  ];

  const handleEdit = (item: any) => { setEditItem(item); setShowForm(true); };
  const handleCancelForm = () => { setShowForm(false); setEditItem(null); };

  const handleSaveMember = (data: any) => {
    if (editItem) updateMember.mutate({ id: editItem.id, ...data });
    else createMember.mutate(data);
  };
  const handleSavePub = (data: any) => {
    if (editItem) updatePub.mutate({ id: editItem.id, ...data });
    else createPub.mutate(data);
  };
  const handleSaveProject = (data: any) => {
    if (editItem) updateProject.mutate({ id: editItem.id, ...data });
    else createProject.mutate(data);
  };
  const handleSavePost = (data: any) => {
    if (editItem) updatePost.mutate({ id: editItem.id, ...data });
    else createPost.mutate(data);
  };

  const allMembers = [...(currentMembers ?? []), ...(alumniMembers ?? [])];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-[var(--seeder-orange)]" />
            <span className="text-gray-400 text-sm font-medium">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-bold seeder-section-header">Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage team members, publications, research projects, and news posts.</p>
        </div>
      </section>

      <section className="section-padding bg-[var(--seeder-gray-light)]">
        <div className="container">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowForm(false); setEditItem(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-[var(--seeder-navy)] text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Team Tab ── */}
          {activeTab === "team" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold seeder-section-header">Team Members</h2>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
                    <Plus size={15} /> Add Member
                  </button>
                )}
              </div>
              {showForm && (
                <div className="mb-6">
                  <TeamMemberForm initial={editItem} onSave={handleSaveMember} onCancel={handleCancelForm} />
                </div>
              )}
              <div className="space-y-2">
                {allMembers.map((m) => (
                  <div key={m.id} className="seeder-card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={m.photoUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e8eaed' rx='4'/%3E%3Ccircle cx='20' cy='16' r='8' fill='%23b0b8c8'/%3E%3Cellipse cx='20' cy='38' rx='14' ry='10' fill='%23b0b8c8'/%3E%3C/svg%3E"} alt={m.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      <div>
                        <p className="font-medium text-[var(--seeder-navy)] text-sm">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.category}{m.isAlumni ? " · Alumni" : ""}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-[var(--seeder-navy)] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Remove this member?")) deleteMember.mutate({ id: m.id }); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {allMembers.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No team members yet. Add your first member above.</p>}
              </div>
            </div>
          )}

          {/* ── Publications Tab ── */}
          {activeTab === "publications" && (
            <PublicationsTabPanel
              publications={publications ?? []}
              showForm={showForm}
              editItem={editItem}
              onAdd={() => { setEditItem(null); setShowForm(true); }}
              onEdit={handleEdit}
              onDelete={(id) => { if (confirm("Remove this publication?")) deletePub.mutate({ id }); }}
              onSave={handleSavePub}
              onCancel={handleCancelForm}
            />
          )}

          {/* ── Research Tab ── */}
          {activeTab === "research" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold seeder-section-header">Research Projects</h2>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
                    <Plus size={15} /> Add Project
                  </button>
                )}
              </div>
              {showForm && (
                <div className="mb-6">
                  <ResearchProjectForm initial={editItem} onSave={handleSaveProject} onCancel={handleCancelForm} />
                </div>
              )}
              <div className="space-y-2">
                {(projects ?? []).map((p) => (
                  <div key={p.id} className="seeder-card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-12 h-10 object-cover rounded-lg" /> : <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Layers size={16} className="text-gray-300" /></div>}
                      <div>
                        <p className="font-medium text-[var(--seeder-navy)] text-sm">{p.title}</p>
                        <p className="text-xs text-gray-400">/research/{p.slug} · {p.isActive ? "Active" : "Hidden"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-[var(--seeder-navy)] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Remove this project?")) deleteProject.mutate({ id: p.id }); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {(projects ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-8">No projects yet. Add your first project above.</p>}
              </div>
            </div>
          )}

          {/* ── News Tab ── */}
          {activeTab === "news" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold seeder-section-header">News &amp; Events</h2>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--seeder-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--seeder-navy-light)] transition-colors">
                    <Plus size={15} /> New Post
                  </button>
                )}
              </div>
              {showForm && (
                <div className="mb-6">
                  <NewsPostForm initial={editItem} onSave={handleSavePost} onCancel={handleCancelForm} />
                </div>
              )}
              <div className="space-y-2">
                {(newsPosts ?? []).map((p) => (
                  <div key={p.id} className="seeder-card p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--seeder-navy)] text-sm">{p.title}</p>
                      <p className="text-xs text-gray-400">{new Date(p.publishedAt).toLocaleDateString("en-SG")} · <span className="capitalize">{p.postType}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-[var(--seeder-navy)] hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Remove this post?")) deletePost.mutate({ id: p.id }); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {(newsPosts ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-8">No posts yet. Create your first post above.</p>}
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === "messages" && (
            <div>
              <h2 className="text-lg font-bold seeder-section-header mb-4">Contact Messages</h2>
              <div className="space-y-3">
                {(messages ?? []).map((msg) => (
                  <div key={msg.id} className={`seeder-card p-5 ${!msg.isRead ? "border-l-4 border-l-[var(--seeder-orange)]" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[var(--seeder-navy)] text-sm">{msg.senderName}</span>
                          {!msg.isRead && <span className="text-xs bg-[var(--seeder-orange)] text-white px-2 py-0.5 rounded-full">New</span>}
                        </div>
                        <a href={`mailto:${msg.senderEmail}`} className="text-xs text-blue-500 hover:underline">{msg.senderEmail}</a>
                        {msg.subject && <p className="text-xs font-medium text-gray-600 mt-1">{msg.subject}</p>}
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleString("en-SG")}</p>
                      </div>
                      {!msg.isRead && (
                        <button onClick={() => markRead.mutate({ id: msg.id })} className="text-xs text-gray-400 hover:text-[var(--seeder-navy)] whitespace-nowrap">Mark read</button>
                      )}
                    </div>
                  </div>
                ))}
                {(messages ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-8">No messages yet.</p>}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
