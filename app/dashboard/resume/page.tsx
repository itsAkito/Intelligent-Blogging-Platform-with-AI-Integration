"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Info,
  Lightbulb,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/NavBar";
import SideNavBar from "@/components/SideNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description: string;
  expanded?: boolean;
}

interface EducationItem {
  degree: string;
  school: string;
  year: string;
}

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  photoUrl: string;
}

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Experience", icon: Building2 },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Brain },
  { label: "Summary", icon: Sparkles },
  { label: "Finalize", icon: FileText },
];

const TEMPLATES = ["Classic", "Modern", "Minimal", "Executive", "Gradient", "Compact"];

const COLOR_THEMES = [
  { id: "blue",    name: "Ocean",     accent: "#003466", bg: "#ffffff", text: "#191c1e", secondary: "#1a4b84" },
  { id: "dark",    name: "Night",     accent: "#38bdf8", bg: "#0f172a", text: "#e2e8f0", secondary: "#0284c7" },
  { id: "forest", name: "Forest",    accent: "#16a34a", bg: "#f0fdf4", text: "#14532d", secondary: "#15803d" },
  { id: "rose",   name: "Rose",      accent: "#be123c", bg: "#fff1f2", text: "#4c0519", secondary: "#9f1239" },
  { id: "purple", name: "Violet",    accent: "#7c3aed", bg: "#faf5ff", text: "#2e1065", secondary: "#6d28d9" },
  { id: "slate",  name: "Slate",     accent: "#475569", bg: "#f8fafc", text: "#0f172a", secondary: "#334155" },
  { id: "amber",  name: "Amber",     accent: "#d97706", bg: "#111827", text: "#f9fafb", secondary: "#b45309" },
  { id: "teal",   name: "Teal",      accent: "#0d9488", bg: "#f0fdfa", text: "#134e4a", secondary: "#0f766e" },
];

const P = {
  primary: "#003466",
  primaryContainer: "#1a4b84",
  primaryFixed: "#d5e3ff",
  tertiary: "#3a009e",
  tertiaryFixed: "#e8deff",
  onTertiaryFixed: "#20005f",
  surface: "#f7f9fb",
  surfaceLow: "#f2f4f6",
  surfaceHigh: "#eceef0",
  surfaceLowest: "#ffffff",
  outline: "#737781",
  outlineVariant: "#c3c6d1",
  onSurface: "#191c1e",
  onSurfaceVariant: "#424750",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#410002",
};

const emptyExperience = (): ExperienceItem => ({
  company: "",
  position: "",
  duration: "",
  description: "",
  expanded: true,
});

const emptyEducation = (): EducationItem => ({ degree: "", school: "", year: "" });

const calcATSScore = (resumeData: ResumeData): number => {
  let score = 0;
  if (resumeData.fullName.trim()) score += 10;
  if (resumeData.email.trim()) score += 10;
  if (resumeData.phone.trim()) score += 10;
  if (resumeData.linkedin.trim()) score += 5;
  if (resumeData.summary.trim().length > 80) score += 20;
  if (resumeData.skills.length >= 5) score += 15;
  if (resumeData.experience.some((e) => e.description.trim().length > 60)) score += 20;
  if (resumeData.education.some((e) => e.degree.trim())) score += 10;
  return Math.min(100, score);
};

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingResume, setLoadingResume] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [activeColorTheme, setActiveColorTheme] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [summaryTone, setSummaryTone] = useState<"executive" | "specialist" | "visionary">("executive");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" }>({
    text: "",
    type: "info",
  });

  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [keySkills, setKeySkills] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    skills: [],
    experience: [emptyExperience()],
    education: [emptyEducation()],
    certifications: [],
    photoUrl: "",
  });

  useEffect(() => {
    setResumeData((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.name || "",
      email: prev.email || user?.email || "",
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<ResumeData>;
        setResumeData((prev) => ({
          ...prev,
          ...parsed,
          experience: parsed.experience?.length ? parsed.experience : prev.experience,
          education: parsed.education?.length ? parsed.education : prev.education,
          certifications: parsed.certifications || [],
        }));
      } catch (error) {
        console.error("Failed to parse resume data:", error);
      }
    }
    setLoadingResume(false);
  }, []);

  const setField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setResumeData((prev) => ({ ...prev, [key]: value }));
  };

  const requiredReady = useMemo(
    () => [
      !!resumeData.fullName.trim() && !!resumeData.email.trim() && !!resumeData.phone.trim(),
      resumeData.experience.some((e) => !!e.position.trim() && !!e.company.trim()),
      resumeData.education.some((e) => !!e.degree.trim()),
      resumeData.skills.length >= 3,
      resumeData.summary.trim().length >= 40,
      true,
    ],
    [resumeData]
  );

  const atsScore = useMemo(() => calcATSScore(resumeData), [resumeData]);

  const previewTheme = useMemo(() => {
    const ct = COLOR_THEMES[activeColorTheme] ?? COLOR_THEMES[0];
    const themes = [
      // Classic
      {
        bg: ct.bg, text: ct.text, heading: ct.accent, border: ct.accent, chip: '#eceef0',
        sideBar: false, font: '"Inter", sans-serif', twoCol: false,
      },
      // Modern (two-column)
      {
        bg: ct.bg, text: ct.text, heading: ct.accent, border: ct.accent, chip: ct.secondary + '22',
        sideBar: false, font: '"Manrope", sans-serif', twoCol: true,
      },
      // Minimal
      {
        bg: ct.bg, text: ct.text, heading: ct.accent, border: ct.accent + '66', chip: '#f5f5f4',
        sideBar: false, font: '"Georgia", serif', twoCol: false,
      },
      // Executive (sidebar)
      {
        bg: ct.bg, text: ct.text, heading: ct.accent, border: ct.accent, chip: ct.accent + '22',
        sideBar: true, font: '"Manrope", sans-serif', twoCol: false,
      },
      // Gradient
      {
        bg: '#ffffff', text: ct.text, heading: ct.accent, border: ct.accent, chip: ct.accent + '18',
        sideBar: false, font: '"Inter", sans-serif', twoCol: false, gradientHeader: true,
      },
      // Compact
      {
        bg: ct.bg, text: ct.text, heading: ct.accent, border: ct.accent, chip: ct.secondary + '18',
        sideBar: false, font: '"Inter", sans-serif', twoCol: false, compact: true,
      },
    ];
    return themes[activeTemplate] ?? themes[0];
  }, [activeTemplate, activeColorTheme]);

  const showMsg = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage({ text: "", type: "info" }), 2500);
  };

  const saveResume = async (showToast = true) => {
    setSaving(true);
    try {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeData }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save resume");
      }
      if (showToast) showMsg("Resume saved successfully.", "success");
    } catch (error) {
      console.error("Save resume failed:", error);
      showMsg("Save failed. Check auth and retry.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill || resumeData.skills.includes(skill)) {
      setNewSkill("");
      return;
    }
    setField("skills", [...resumeData.skills, skill]);
    setNewSkill("");
  };

  const addCertification = () => {
    const cert = newCert.trim();
    if (!cert) return;
    setField("certifications", [...resumeData.certifications, cert]);
    setNewCert("");
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string | boolean) => {
    setField(
      "experience",
      resumeData.experience.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    setField(
      "education",
      resumeData.education.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerateWithAI = async () => {
    if (!user?.id) {
      showMsg("Please sign in to use AI generation.", "error");
      return;
    }
    setAiLoading(true);
    try {
      const toneMap = {
        executive: "authoritative executive tone with measurable impact",
        specialist: "technical specialist tone with deep expertise",
        visionary: "creative visionary tone emphasizing innovation",
      };
      const prompt = [
        "Create a resume summary and skills list.",
        `Tone: ${toneMap[summaryTone]}`,
        `Specialty: ${specialty}`,
        `Years of experience: ${experienceYears}`,
        `Target role: ${targetRole}`,
        `Key skills hint: ${keySkills}`,
        "Output format:",
        "SUMMARY: <2-4 sentences>",
        "SKILLS: skill1, skill2, skill3, skill4, skill5, skill6",
      ].join("\n");

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt, tone: "professional", userId: user.id }),
      });
      if (!response.ok) throw new Error("AI generation failed");

      const data = await response.json();
      const raw = (data.content || "") as string;
      const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?:\nSKILLS:|$)/i);
      const skillsMatch = raw.match(/SKILLS:\s*([\s\S]*)/i);
      const generatedSummary = summaryMatch?.[1]?.trim();
      const generatedSkills = skillsMatch?.[1]
        ?.split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      setResumeData((prev) => ({
        ...prev,
        summary: generatedSummary || prev.summary,
        skills: generatedSkills?.length ? generatedSkills : prev.skills,
      }));
      showMsg("AI narrative generated.", "success");
    } catch (error) {
      console.error("AI generation failed:", error);
      showMsg("AI generation failed.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleEnhanceBullet = async (index: number) => {
    const exp = resumeData.experience[index];
    if (!exp.description.trim()) {
      showMsg("Add an experience bullet first.", "info");
      return;
    }
    if (!user?.id) {
      showMsg("Please sign in to use AI enhance.", "error");
      return;
    }

    setEnhancingIdx(index);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic:
            "Rewrite these experience bullets to be ATS-friendly, metric-driven and concise. Return only improved bullet points with each line starting with '-'.\n\n" +
            `Role: ${exp.position} at ${exp.company}\n\nOriginal:\n${exp.description}`,
          tone: "professional",
          userId: user.id,
        }),
      });
      if (!response.ok) throw new Error("Enhancement failed");
      const payload = await response.json();
      const enhanced = payload.content?.trim();
      if (enhanced) {
        updateExperience(index, "description", enhanced);
        showMsg("Bullets enhanced with AI.", "success");
      }
    } catch (error) {
      console.error(error);
      showMsg("Enhancement failed.", "error");
    } finally {
      setEnhancingIdx(null);
    }
  };

  const buildResumeText = () =>
    [
      resumeData.fullName,
      `${resumeData.email} | ${resumeData.phone}${resumeData.linkedin ? ` | ${resumeData.linkedin}` : ""}`,
      `${resumeData.address}${resumeData.location ? `, ${resumeData.location}` : ""}`,
      "",
      "SUMMARY",
      resumeData.summary,
      "",
      "SKILLS",
      resumeData.skills.join(", "),
      "",
      "EXPERIENCE",
      ...resumeData.experience.map((e) => `${e.position} - ${e.company} (${e.duration})\n${e.description}`),
      "",
      "EDUCATION",
      ...resumeData.education.map((e) => `${e.degree} - ${e.school} (${e.year})`),
      "",
      "CERTIFICATIONS",
      ...resumeData.certifications,
    ].join("\n");

  const downloadBlob = (content: BlobPart, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportResume = async (format: "pdf" | "doc" | "txt" | "json" | "html" | "jpg") => {
    const base = (resumeData.fullName || "resume").replace(/\s+/g, "-").toLowerCase();

    if (format === "txt") {
      downloadBlob(buildResumeText(), "text/plain", `${base}.txt`);
      return;
    }
    if (format === "json") {
      downloadBlob(JSON.stringify(resumeData, null, 2), "application/json", `${base}.json`);
      return;
    }
    if (format === "html" || format === "doc") {
      const html = previewRef.current?.outerHTML || `<pre>${buildResumeText()}</pre>`;
      const wrapped = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Resume</title></head><body style=\"font-family:Inter,sans-serif;max-width:850px;margin:auto;padding:2rem\">${html}</body></html>`;
      downloadBlob(wrapped, format === "html" ? "text/html" : "application/msword", `${base}.${format}`);
      return;
    }
    if (format === "pdf") {
      window.print();
      return;
    }
    if (format === "jpg" && previewRef.current) {
      const dataUrl = await toJpeg(previewRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${base}.jpg`;
      a.click();
    }
  };

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "resume-photos");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setField("photoUrl", data.url);
      showMsg("Photo uploaded.", "success");
    } catch {
      showMsg("Photo upload failed.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loadingResume) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center" style={{ background: P.surface }}>
          <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: P.primaryFixed, borderTopColor: P.primary }} />
        </div>
      </ProtectedRoute>
    );
  }

  const scoreCircumference = 2 * Math.PI * 38;
  const scoreDashOffset = scoreCircumference - (atsScore / 100) * scoreCircumference;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen" style={{ background: P.surface, color: P.onSurface }}>
        <SideNavBar activePage="resume" />
        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <Navbar />

          <main className="flex-1 overflow-auto pb-28 pt-20">
            <div className="border-b px-6 pb-6 pt-8" style={{ borderColor: `${P.outlineVariant}66` }}>
              <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: P.tertiary }}>AI Resume Builder</p>
                  <h1 className="font-headline text-3xl font-black md:text-4xl" style={{ color: P.primary }}>
                    AiBlog Resume Architect
                  </h1>
                  <p className="mt-2 text-sm" style={{ color: P.onSurfaceVariant }}>
                    Build ATS-optimized resumes with AI-generated narrative and live quality scoring.
                  </p>
                </div>

                <div className="flex min-w-55 items-center gap-4 rounded-2xl border bg-white/90 p-4 shadow-lg" style={{ borderColor: `${P.outlineVariant}66` }}>
                  <div className="relative h-20 w-20">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="38" fill="transparent" stroke={P.surfaceHigh} strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="transparent"
                        stroke={atsScore >= 80 ? P.tertiary : atsScore >= 60 ? "#f59e0b" : P.error}
                        strokeWidth="8"
                        strokeDasharray={scoreCircumference}
                        strokeDashoffset={scoreDashOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black" style={{ color: P.primary }}>{atsScore}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: P.outline }}>ATS</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: P.primary }}>ATS Readiness</p>
                    <p className="text-xs" style={{ color: P.onSurfaceVariant }}>
                      {atsScore >= 80 ? "Excellent" : atsScore >= 60 ? "Good" : "Needs improvement"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 pt-6 lg:px-10">
              <div className="mb-8 overflow-x-auto">
                <div className="flex min-w-max items-center gap-2">
                  {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const active = step === idx;
                    const done = idx < step && requiredReady[idx];
                    return (
                      <button
                        key={s.label}
                        onClick={() => setStep(idx)}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                        style={{
                          background: active ? P.primary : done ? P.primaryFixed : P.surfaceLow,
                          color: active ? "#fff" : done ? P.primary : P.outline,
                        }}
                      >
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        {idx + 1}. {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {message.text && (
                <div
                  className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{
                    background:
                      message.type === "success"
                        ? "#dcfce7"
                        : message.type === "error"
                          ? P.errorContainer
                          : P.tertiaryFixed,
                    color:
                      message.type === "success"
                        ? "#166534"
                        : message.type === "error"
                          ? P.onErrorContainer
                          : P.onTertiaryFixed,
                  }}
                >
                  {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                  {step === 0 && (
                    <section className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                      <h2 className="mb-4 text-lg font-bold" style={{ color: P.primary }}>Personal Information</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          ["Full Name", "fullName", "Alex Architect"],
                          ["Email", "email", "alex@email.com"],
                          ["Phone", "phone", "+1 (555) 000-0000"],
                          ["Location", "location", "San Francisco, CA"],
                          ["Street Address", "address", "123 Main St"],
                          ["LinkedIn URL", "linkedin", "linkedin.com/in/alex"],
                          ["Website / Portfolio", "website", "https://yoursite.com"],
                        ].map(([label, field, placeholder]) => (
                          <div key={String(field)} className={field === "address" || field === "linkedin" || field === "website" ? "md:col-span-2" : ""}>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: P.outline }}>{label}</label>
                            <input
                              value={resumeData[field as keyof ResumeData] as string}
                              onChange={(e) => setField(field as keyof ResumeData, e.target.value as never)}
                              placeholder={String(placeholder)}
                              className={inputClass}
                              style={{ borderColor: P.outlineVariant }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: P.outline }}>Profile Photo (optional)</label>
                        <div className="flex items-center gap-4">
                          {resumeData.photoUrl && (
                            <Image src={resumeData.photoUrl} alt="Profile" width={64} height={64} className="h-16 w-16 rounded-full object-cover border-2" style={{ borderColor: P.outlineVariant }} />
                          )}
                          <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity" style={{ borderColor: P.outlineVariant, color: P.primary }}>
                            {uploadingPhoto ? "Uploading..." : resumeData.photoUrl ? "Change Photo" : "Upload Photo"}
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                          </label>
                          {resumeData.photoUrl && (
                            <button onClick={() => setField("photoUrl", "")} className="text-xs" style={{ color: P.error }}>Remove</button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-start gap-2 rounded-xl p-3" style={{ background: P.tertiaryFixed, color: P.onTertiaryFixed }}>
                        <Lightbulb className="mt-0.5 h-4 w-4" />
                        <p className="text-xs font-medium">Adding LinkedIn can boost recruiter response rates.</p>
                      </div>
                    </section>
                  )}

                  {step === 1 && (
                    <section className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={`exp-${index}`} className="rounded-2xl border bg-white" style={{ borderColor: `${P.outlineVariant}66` }}>
                          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: `${P.outlineVariant}66` }}>
                            <p className="font-bold" style={{ color: P.primary }}>{exp.position || "New Experience"}</p>
                            <div className="flex items-center gap-2">
                              {index > 0 && (
                                <button onClick={() => setField("experience", resumeData.experience.filter((_, i) => i !== index))} style={{ color: P.error }}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => updateExperience(index, "expanded", !exp.expanded)} style={{ color: P.outline }}>
                                {exp.expanded === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {exp.expanded !== false && (
                            <div className="space-y-4 p-5">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <input value={exp.position} onChange={(e) => updateExperience(index, "position", e.target.value)} placeholder="Job title" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                                <input value={exp.company} onChange={(e) => updateExperience(index, "company", e.target.value)} placeholder="Company" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                                <input value={exp.duration} onChange={(e) => updateExperience(index, "duration", e.target.value)} placeholder="2020 - Present" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                              </div>
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: P.outline }}>Impact Bullets</p>
                                  <button
                                    onClick={() => handleEnhanceBullet(index)}
                                    disabled={enhancingIdx === index}
                                    className="rounded-lg px-3 py-1 text-xs font-bold"
                                    style={{ background: P.tertiaryFixed, color: P.tertiary }}
                                  >
                                    {enhancingIdx === index ? "Enhancing..." : "AI Enhance"}
                                  </button>
                                </div>
                                <textarea
                                  value={exp.description}
                                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                                  rows={5}
                                  className="w-full rounded-lg border p-3 text-sm outline-none"
                                  style={{ borderColor: P.outlineVariant }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => setField("experience", [...resumeData.experience, emptyExperience()])}
                        className="w-full rounded-2xl border-2 border-dashed py-3 text-sm font-bold"
                        style={{ borderColor: P.tertiary, color: P.tertiary }}
                      >
                        <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add Experience</span>
                      </button>
                    </section>
                  )}

                  {step === 2 && (
                    <section className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={`edu-${index}`} className="rounded-2xl border bg-white p-5" style={{ borderColor: `${P.outlineVariant}66` }}>
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold" style={{ color: P.primary }}>{edu.degree || `Education ${index + 1}`}</h3>
                            {index > 0 && (
                              <button onClick={() => setField("education", resumeData.education.filter((_, i) => i !== index))} style={{ color: P.error }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <input value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} placeholder="Degree" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                            <input value={edu.school} onChange={(e) => updateEducation(index, "school", e.target.value)} placeholder="School" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                            <input value={edu.year} onChange={(e) => updateEducation(index, "year", e.target.value)} placeholder="Year" className={inputClass} style={{ borderColor: P.outlineVariant }} />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setField("education", [...resumeData.education, emptyEducation()])}
                        className="w-full rounded-2xl border-2 border-dashed py-3 text-sm font-bold"
                        style={{ borderColor: P.tertiary, color: P.tertiary }}
                      >
                        <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add Education</span>
                      </button>

                      <div className="rounded-2xl border bg-white p-5" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h3 className="mb-3 font-bold" style={{ color: P.primary }}>Certifications</h3>
                        <div className="mb-3 flex gap-2">
                          <input value={newCert} onChange={(e) => setNewCert(e.target.value)} className={inputClass} placeholder="AWS, PMP, CFA..." style={{ borderColor: P.outlineVariant }} />
                          <button className="rounded-lg px-3 text-sm font-bold text-white" style={{ background: P.primary }} onClick={addCertification}>Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.certifications.map((cert, idx) => (
                            <span key={`${cert}-${idx}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: P.primaryFixed, color: P.primary }}>
                              {cert}
                              <button onClick={() => setField("certifications", resumeData.certifications.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {step === 3 && (
                    <section className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                      <h2 className="mb-4 text-lg font-bold" style={{ color: P.primary }}>Skills</h2>
                      <div className="mb-4 flex gap-2">
                        <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className={inputClass} placeholder="React, TypeScript, Leadership..." style={{ borderColor: P.outlineVariant }} />
                        <button className="rounded-lg px-3 text-sm font-bold text-white" style={{ background: P.primary }} onClick={addSkill}>Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, idx) => (
                          <span key={`${skill}-${idx}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: P.surfaceHigh, color: P.onSurfaceVariant }}>
                            {skill}
                            <button onClick={() => setField("skills", resumeData.skills.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {step === 4 && (
                    <section className="space-y-4">
                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h2 className="mb-3 text-lg font-bold" style={{ color: P.primary }}>AI Narrative</h2>
                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                          {(["executive", "specialist", "visionary"] as const).map((tone) => (
                            <button
                              key={tone}
                              onClick={() => setSummaryTone(tone)}
                              className="rounded-xl border px-4 py-3 text-left"
                              style={{
                                borderColor: summaryTone === tone ? P.primary : P.outlineVariant,
                                background: summaryTone === tone ? P.primaryFixed : P.surfaceLow,
                              }}
                            >
                              <p className="font-bold capitalize" style={{ color: P.primary }}>{tone}</p>
                            </button>
                          ))}
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputClass} placeholder="Specialty" style={{ borderColor: P.outlineVariant }} />
                          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={inputClass} placeholder="Target role" style={{ borderColor: P.outlineVariant }} />
                          <input value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={inputClass} placeholder="Years of experience" style={{ borderColor: P.outlineVariant }} />
                          <input value={keySkills} onChange={(e) => setKeySkills(e.target.value)} className={inputClass} placeholder="Key skills hints" style={{ borderColor: P.outlineVariant }} />
                        </div>

                        <button className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.primaryContainer})` }} onClick={handleGenerateWithAI} disabled={aiLoading}>
                          {aiLoading ? "Generating..." : "Generate with AI"}
                        </button>
                      </div>

                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: P.outline }}>Professional Summary</label>
                        <textarea value={resumeData.summary} onChange={(e) => setField("summary", e.target.value)} rows={6} className="w-full rounded-lg border p-3 text-sm outline-none" style={{ borderColor: P.outlineVariant }} />
                      </div>
                    </section>
                  )}

                  {step === 5 && (
                    <section className="space-y-4">
                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h2 className="mb-3 text-lg font-bold" style={{ color: P.primary }}>ATS Intelligence</h2>
                        <div className="space-y-2">
                          {[
                            [!!resumeData.fullName.trim(), "Full name"],
                            [!!resumeData.email.trim(), "Email"],
                            [!!resumeData.phone.trim(), "Phone"],
                            [resumeData.skills.length >= 5, "At least 5 skills"],
                            [resumeData.summary.trim().length > 80, "Strong summary"],
                          ].map(([ok, label]) => (
                            <div key={String(label)} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: ok ? "#f0fdf4" : `${P.errorContainer}66` }}>
                              {ok ? <Check className="h-4 w-4 text-green-700" /> : <X className="h-4 w-4" style={{ color: P.error }} />}
                              <span className="text-sm" style={{ color: P.onSurfaceVariant }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h2 className="mb-3 text-lg font-bold" style={{ color: P.primary }}>Template</h2>
                        <div className="grid grid-cols-3 gap-3">
                          {TEMPLATES.map((tpl, idx) => (
                            <button key={tpl} className="rounded-xl border p-3 text-xs font-bold uppercase" style={{ borderColor: activeTemplate === idx ? P.primary : P.outlineVariant, color: activeTemplate === idx ? P.primary : P.outline, background: activeTemplate === idx ? `${P.primary}10` : "transparent" }} onClick={() => setActiveTemplate(idx)}>
                              {tpl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h2 className="mb-3 text-lg font-bold" style={{ color: P.primary }}>Color Theme</h2>
                        <div className="flex flex-wrap gap-3">
                          {COLOR_THEMES.map((ct, idx) => (
                            <button
                              key={ct.name}
                              onClick={() => setActiveColorTheme(idx)}
                              title={ct.name}
                              className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                              style={{ background: ct.accent, borderColor: activeColorTheme === idx ? P.primary : "transparent", boxShadow: activeColorTheme === idx ? `0 0 0 2px ${P.primary}` : "none" }}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs font-medium" style={{ color: P.outline }}>{COLOR_THEMES[activeColorTheme]?.name}</p>
                      </div>

                      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: `${P.outlineVariant}66` }}>
                        <h2 className="mb-3 text-lg font-bold" style={{ color: P.primary }}>Export</h2>
                        <div className="grid grid-cols-3 gap-2">
                          {(["pdf", "doc", "txt", "json", "html", "jpg"] as const).map((fmt) => (
                            <button key={fmt} onClick={() => exportResume(fmt)} className="rounded-lg border px-3 py-2 text-xs font-bold uppercase" style={{ borderColor: P.outlineVariant, color: P.onSurfaceVariant }}>
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  <div className="flex items-center justify-between">
                    <button className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: P.surfaceLow, color: P.outline }} disabled={step === 0} onClick={() => setStep((p) => Math.max(0, p - 1))}>
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: P.outlineVariant, color: P.onSurfaceVariant }} onClick={() => saveResume(true)} disabled={saving}>
                        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                      </button>
                      {step < STEPS.length - 1 && (
                        <button
                          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.primaryContainer})` }}
                          onClick={async () => {
                            await saveResume(false);
                            setStep((p) => p + 1);
                          }}
                        >
                          Save & Continue <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-2">
                  <div className="sticky top-24 space-y-3">
                    <button className="w-full rounded-xl py-2 text-sm font-bold lg:hidden" style={{ background: P.primaryFixed, color: P.primary }} onClick={() => setShowPreview((p) => !p)}>
                      <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"} Preview</span>
                    </button>

                    <div
                      className={`${showPreview ? "block" : "hidden"} overflow-hidden rounded-2xl shadow-2xl lg:block`}
                      ref={previewRef}
                      style={{ background: previewTheme.bg, color: previewTheme.text, fontFamily: previewTheme.font, fontSize: "11px" }}
                    >
                      {/* Resume Header */}
                      <div
                        className="px-7 pb-5 pt-7"
                        style={{
                          borderBottom: `2px solid ${previewTheme.border}`,
                          background: (previewTheme as { gradientHeader?: boolean }).gradientHeader
                            ? `linear-gradient(135deg, ${previewTheme.heading}18 0%, ${previewTheme.bg} 100%)`
                            : previewTheme.bg,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {resumeData.photoUrl && (
                            <Image
                              src={resumeData.photoUrl}
                              alt="Profile"
                              width={64}
                              height={64}
                              className="mt-1 h-16 w-16 shrink-0 rounded-full object-cover border-2"
                              style={{ borderColor: previewTheme.border }}
                            />
                          )}
                          <div className="min-w-0">
                            <h2 className="font-headline text-xl font-black leading-tight" style={{ color: previewTheme.heading }}>
                              {resumeData.fullName || "YOUR NAME"}
                            </h2>
                            <p className="mt-0.5 text-xs font-bold" style={{ color: previewTheme.heading, opacity: 0.8 }}>
                              {resumeData.experience.find((e) => e.position)?.position || "Target Role"}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]" style={{ color: previewTheme.text, opacity: 0.75 }}>
                              {resumeData.email && <span>{resumeData.email}</span>}
                              {resumeData.phone && <span>{resumeData.phone}</span>}
                              {resumeData.location && <span>{resumeData.location}</span>}
                              {resumeData.linkedin && <span>{resumeData.linkedin}</span>}
                              {resumeData.website && <span>{resumeData.website}</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 px-7 py-5">
                        {/* Summary */}
                        {resumeData.summary && (
                          <section>
                            <h3 className="mb-1.5 border-b pb-0.5 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: previewTheme.heading, borderColor: `${previewTheme.border}55` }}>
                              Professional Summary
                            </h3>
                            <p className="leading-relaxed" style={{ color: previewTheme.text }}>{resumeData.summary}</p>
                          </section>
                        )}

                        {/* Skills */}
                        {resumeData.skills.length > 0 && (
                          <section>
                            <h3 className="mb-2 border-b pb-0.5 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: previewTheme.heading, borderColor: `${previewTheme.border}55` }}>
                              Core Skills
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeData.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                                  style={{ background: previewTheme.chip, color: previewTheme.heading }}
                                >{skill}</span>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Experience */}
                        {resumeData.experience.some((e) => e.position) && (
                          <section>
                            <h3 className="mb-2 border-b pb-0.5 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: previewTheme.heading, borderColor: `${previewTheme.border}55` }}>
                              Work Experience
                            </h3>
                            <div className="space-y-3">
                              {resumeData.experience.filter((e) => e.position).slice(0, 3).map((exp, idx) => (
                                <div key={`prev-exp-${idx}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-bold leading-tight" style={{ color: previewTheme.text }}>{exp.position}</p>
                                      <p className="font-semibold" style={{ color: previewTheme.heading }}>{exp.company}</p>
                                    </div>
                                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: previewTheme.chip, color: previewTheme.text }}>{exp.duration}</span>
                                  </div>
                                  {exp.description && (
                                    <ul className="mt-1 space-y-0.5 pl-2">
                                      {exp.description.split("\n").filter(Boolean).slice(0, 4).map((line, li) => (
                                        <li key={li} className="flex items-start gap-1.5 leading-snug" style={{ color: previewTheme.text }}>
                                          <span className="mt-0.75 shrink-0 text-[8px]" style={{ color: previewTheme.heading }}>▸</span>
                                          <span>{line.replace(/^[-•*]\s*/, "")}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Education */}
                        {resumeData.education.some((e) => e.degree) && (
                          <section>
                            <h3 className="mb-2 border-b pb-0.5 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: previewTheme.heading, borderColor: `${previewTheme.border}55` }}>
                              Education
                            </h3>
                            <div className="space-y-2">
                              {resumeData.education.filter((e) => e.degree).slice(0, 2).map((edu, idx) => (
                                <div key={`prev-edu-${idx}`} className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold leading-tight" style={{ color: previewTheme.text }}>{edu.degree}</p>
                                    <p style={{ color: previewTheme.heading }}>{edu.school}</p>
                                  </div>
                                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: previewTheme.chip, color: previewTheme.text }}>{edu.year}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Certifications */}
                        {resumeData.certifications.some(Boolean) && (
                          <section>
                            <h3 className="mb-1.5 border-b pb-0.5 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: previewTheme.heading, borderColor: `${previewTheme.border}55` }}>
                              Certifications
                            </h3>
                            <ul className="space-y-0.5">
                              {resumeData.certifications.filter(Boolean).map((cert, i) => (
                                <li key={i} className="flex items-center gap-1.5" style={{ color: previewTheme.text }}>
                                  <span style={{ color: previewTheme.heading }}>✓</span> {cert}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur" style={{ borderColor: `${P.outlineVariant}66` }}>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2" style={{ background: P.primaryFixed }}>
                  <FileText className="h-4 w-4" style={{ color: P.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: P.primary }}>{resumeData.fullName || "Untitled Resume"}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: P.outline }}>{TEMPLATES[activeTemplate]} • ATS {atsScore}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-xl border px-4 py-2 text-sm font-bold" style={{ borderColor: P.outlineVariant, color: P.onSurfaceVariant }} onClick={() => saveResume(true)} disabled={saving}>
                  <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" /> {saving ? "..." : "Save"}</span>
                </button>
                <button className="rounded-xl px-5 py-2 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.primaryContainer})` }} onClick={() => exportResume("pdf")}>
                  <span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Finalize & Export PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
