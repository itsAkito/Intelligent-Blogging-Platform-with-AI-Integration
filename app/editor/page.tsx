"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/NavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { renderMarkdownBlocks } from "@/lib/markdown";
import { BLOG_THEMES, BlogTheme, getThemeById, getThemeFromAny } from "@/lib/blog-themes";

type Collaborator = {
  id: string;
  user_id: string;
  permission: "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
  profiles?: { id: string; name?: string; email?: string; avatar_url?: string };
};

type IncomingInvite = {
  id: string;
  post_id: string;
  permission: "editor" | "viewer";
  posts?: { title?: string; slug?: string };
  inviter?: { id: string; name?: string; email?: string };
};

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const themeParam = searchParams.get("theme");
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [category, setCategory] = useState("Technology");
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [useAIImage, setUseAIImage] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandPosition, setSlashCommandPosition] = useState({ top: 0, left: 0 });
  const [blogTheme, setBlogTheme] = useState("default");
  const [availableThemes, setAvailableThemes] = useState<BlogTheme[]>(BLOG_THEMES);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCollaboratorBlock, setShowCollaboratorBlock] = useState(searchParams.get("collab") === "1");
  const [postAuthorId, setPostAuthorId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"editor" | "viewer">("editor");
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabFeedback, setCollabFeedback] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const writingTemplates = [
    {
      id: "blog-post",
      label: "Blog Post",
      category: "Technology",
      title: "How to Solve [Problem] with [Approach]",
      excerpt: "A practical breakdown of the challenge, the strategy, and key outcomes.",
      topic: "Technical Writing",
      content: `## Introduction

Write one short paragraph framing the reader's pain point and why this topic matters now.

## The Core Problem

- Context and constraints
- Why common approaches fail
- What success looks like

## Solution Breakdown

### 1. Set Up

Explain the required setup and assumptions.

### 2. Implementation

Walk through the key implementation steps with concrete examples.

### 3. Validation

Show how you tested and validated results.

## Key Takeaways

- Takeaway 1
- Takeaway 2
- Takeaway 3

## Next Steps

Recommend what readers should do next.`
    },
    {
      id: "meeting-notes",
      label: "Meeting Notes",
      category: "Business",
      title: "Meeting Notes: [Project / Team Name]",
      excerpt: "Decisions, action items, and owners from today's meeting.",
      topic: "Team Collaboration",
      content: `## Meeting Details

- Date:
- Time:
- Attendees:
- Facilitator:

## Agenda

1. Topic one
2. Topic two
3. Topic three

## Discussion Notes

### Topic 1

- Summary:
- Risks / blockers:

### Topic 2

- Summary:
- Risks / blockers:

## Decisions Made

- Decision 1
- Decision 2

## Action Items

- [ ] Owner - Task - Due date
- [ ] Owner - Task - Due date

## Parking Lot

- Items deferred for later discussion`
    },
    {
      id: "code-snippet",
      label: "Code Snippet",
      category: "Technology",
      title: "Code Walkthrough: [Feature Name]",
      excerpt: "A focused explanation of a useful snippet and how to adapt it.",
      topic: "Developer Guide",
      content: `## What This Snippet Solves

Explain the use case in one or two sentences.

## Code

\`\`\`ts
export function example(input: string) {
  if (!input.trim()) {
    throw new Error("Input is required");
  }

  return input.toLowerCase();
}
\`\`\`

## How It Works

1. Validate input
2. Transform data
3. Return normalized output

## Integration Tips

- Add tests for edge cases
- Handle runtime errors where this is called
- Extend with domain-specific validation`
    },
  ];

  const applyTemplate = (templateId: string) => {
    const template = writingTemplates.find((item) => item.id === templateId);
    if (!template) return;

    if (content.trim().length > 20) {
      const shouldReplace = window.confirm("Replace your current draft with this template?");
      if (!shouldReplace) return;
    }

    setTitle(template.title);
    setExcerpt(template.excerpt);
    setTopic(template.topic);
    setCategory(template.category);
    setContent(template.content);
    setSuccess(`${template.label} template applied`);
    setTimeout(() => setSuccess(""), 2500);
  };

  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        setUploadingInlineImage(true);
        setSuccess("Uploading pasted image...");

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "blog-inline");
          const response = await fetch("/api/upload", { method: "POST", body: formData });
          if (!response.ok) throw new Error("Upload failed");
          const data = await response.json();
          const imageUrl = data.url;

          // Insert markdown image at cursor position
          const textarea = contentRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const before = content.substring(0, start);
            const after = content.substring(start);
            const imageMarkdown = `\n![image](${imageUrl})\n`;
            setContent(before + imageMarkdown + after);
            setTimeout(() => {
              textarea.focus();
              const newPos = start + imageMarkdown.length;
              textarea.setSelectionRange(newPos, newPos);
            }, 0);
          }

          setSuccess("Image inserted!");
          setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
          setError("Failed to upload pasted image: " + String(err));
        } finally {
          setUploadingInlineImage(false);
        }
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormat("**", "**");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormat("*", "*");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertFormat("[", "](url)");
      return;
    }

    if (e.key === "/") {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const text = textarea.value.substring(0, start);
        const lines = text.split("\n");
        const lastLine = lines[lines.length - 1];
        const lastChar = lastLine.charAt(lastLine.length - 1);

        if (lastChar === "/" || lastLine.length === 0) {
            const cursorPosition = getCursorXY(textarea, start);
            if (cursorPosition) {
                setSlashCommandPosition({ top: cursorPosition.y + 20, left: cursorPosition.x });
                setShowSlashCommand(true);
            }
        }
      }
    }
  };
  // a function to get the x and y of the cursor
    const getCursorXY = (input: HTMLTextAreaElement, selectionPoint: number) => {
        const { offsetLeft, offsetTop } = input;
        const div = document.createElement("div");
        const copyStyle = getComputedStyle(input);
        for (const prop of copyStyle) {
            div.style[prop as any] = copyStyle[prop as any];
        }
        div.style.whiteSpace = "pre-wrap";
        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.overflow = "hidden";

        const text = input.value.substring(0, selectionPoint);
        div.textContent = text;
        document.body.appendChild(div);

        const span = document.createElement("span");
        span.textContent = input.value.substring(selectionPoint) || ".";
        div.appendChild(span);

        const { offsetLeft: spanOffsetLeft, offsetTop: spanOffsetTop } = span;
        document.body.removeChild(div);

        return {
            x: offsetLeft + spanOffsetLeft,
            y: offsetTop + spanOffsetTop,
        };
    };


  // Markdown formatting helper
  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);
    const formatted = selected
      ? `${before}${prefix}${selected}${suffix}${after}`
      : `${before}${prefix}text${suffix}${after}`;
    setContent(formatted);
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const cursorPos = selected ? start + prefix.length + selected.length + suffix.length : start + prefix.length;
      textarea.setSelectionRange(selected ? cursorPos : start + prefix.length, selected ? cursorPos : start + prefix.length + 4);
    }, 0);
  };

  const slashCommands = [
    { label: "Heading 1", action: () => insertFormat("\n# ", "") },
    { label: "Heading 2", action: () => insertFormat("\n## ", "") },
    { label: "Bullet List", action: () => insertFormat("\n- ", "") },
    { label: "Numbered List", action: () => insertFormat("\n1. ", "") },
    { label: "Blockquote", action: () => insertFormat("\n> ", "") },
    { label: "Code Block", action: () => insertFormat("\n```\n", "\n```\n") },
    { label: "Image", action: () => insertFormat("![", "](url)") },
    { label: "Table", action: () => insertFormat("\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n", "") },
    { label: "Checklist", action: () => insertFormat("\n- [ ] Task 1\n- [ ] Task 2\n", "") },
    { label: "Callout", action: () => insertFormat("\n> [!NOTE] Add your key insight here\n", "") },
  ];

  // Load existing post when editing
  const loadPost = useCallback(async () => {
    if (!editId) return;
    try {
      const response = await fetch(`/api/posts/${editId}`);
      if (response.ok) {
        const post = await response.json();
        setTitle(post.title || "");
        setContent(post.content || "");
        setExcerpt(post.excerpt || "");
        setTopic(post.topic || "");
        setCoverImageUrl(post.cover_image_url || "");
        setPostAuthorId(post.author_id || null);
        setBlogTheme(post.blog_theme || "default");
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    }
  }, [editId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    let active = true;
    const loadThemes = async () => {
      try {
        const response = await fetch("/api/blog-themes?includeBuiltin=true", { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        const themes = Array.isArray(data.themes) ? data.themes.map((theme: any) => getThemeFromAny(theme)) : BLOG_THEMES;
        if (active && themes.length > 0) {
          setAvailableThemes(themes);
        }
      } catch {
        // Keep built-ins when API is unavailable.
      }
    };

    loadThemes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!themeParam || isEditing) return;
    if (availableThemes.some((theme) => theme.id === themeParam)) {
      setBlogTheme(themeParam);
    }
  }, [themeParam, isEditing, availableThemes]);

  const loadCollaborators = useCallback(async () => {
    if (!editId) {
      setCollaborators([]);
      return;
    }

    try {
      setCollabLoading(true);
      const response = await fetch(`/api/posts/${editId}/collaborators`);
      if (!response.ok) {
        setCollaborators([]);
        return;
      }
      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      console.error("Failed to load collaborators:", err);
      setCollaborators([]);
    } finally {
      setCollabLoading(false);
    }
  }, [editId]);

  const loadIncomingInvites = useCallback(async () => {
    try {
      const response = await fetch("/api/collaboration/invites");
      if (!response.ok) {
        setIncomingInvites([]);
        return;
      }
      const data = await response.json();
      setIncomingInvites(data.invites || []);
    } catch (err) {
      console.error("Failed to load collaboration invites:", err);
      setIncomingInvites([]);
    }
  }, []);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  useEffect(() => {
    loadIncomingInvites();
  }, [loadIncomingInvites]);

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const selectedTheme = availableThemes.find((theme) => theme.id === blogTheme) || getThemeById(blogTheme);
  const isPostOwner = !!(user?.id && postAuthorId && user.id === postAuthorId);

  const handleGenerateWithAI = async () => {
    if (!user) { setError("You must be logged in."); return; }
    if (!topic.trim()) { setError("Enter a topic for AI generation"); return; }
    setGeneratingAI(true);
    setError("");
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to generate content");
      const data = await response.json();
      setContent(data.content || "");
      setTitle(data.title || "");
      setExcerpt(data.excerpt || "");
      setIsAiGenerated(true);
      setSuccess("Content generated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!content.trim()) return;
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: `Generate a compelling title for this content: ${content.substring(0, 500)}`, tone, userId: user?.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title || data.content?.split("\n")[0] || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim() || title.trim() || topic.trim();
    if (!prompt) { setError("Enter a title or image prompt first"); return; }
    setGeneratingImage(true);
    setError("");
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();
      setCoverImageUrl(data.imageUrl);
      setSuccess("Cover image generated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog-covers");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setCoverImageUrl(data.url);
      setSuccess("Image uploaded!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim()) return;
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: `Summarize this content concisely in 2-3 sentences:\n\n${content.substring(0, 2000)}`, tone, userId: user?.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setExcerpt(data.content || data.excerpt || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const [toneAnalysis, setToneAnalysis] = useState<string | null>(null);

  const handleCheckTone = async () => {
    if (!content.trim()) return;
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Analyze the tone of the following text and provide a brief analysis (e.g., formal, informal, confident, etc.):\n\n${content}`,
          userId: user?.id,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setToneAnalysis(data.content);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze tone.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handlePublish = async () => {
    if (!user) { setError("You must be logged in."); return; }
    if (!title.trim() || !content.trim()) { setError("Title and content are required"); return; }
    setLoading(true);
    setError("");
    try {
      const url = isEditing ? `/api/posts/${editId}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 150),
          topic,
          category,
          cover_image_url: coverImageUrl || null,
          ai_generated: isAiGenerated,
          userId: user.id,
          published: true,
          blog_theme: blogTheme,
        }),
      });
      if (!response.ok) throw new Error("Failed to publish");
      setSuccess(isEditing ? "Updated!" : "Published!");
      setTimeout(() => router.push("/dashboard/posts"), 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-save draft every 30 seconds
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");

  const setCollabMessage = (message: string) => {
    setCollabFeedback(message);
    setTimeout(() => setCollabFeedback(""), 2500);
  };

  const handleInviteCollaborator = async () => {
    if (!editId || !inviteEmail.trim()) return;

    try {
      setCollabLoading(true);
      const response = await fetch(`/api/posts/${editId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), permission: invitePermission }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteEmail("");
      setCollabMessage("Collaboration invite sent.");
      await loadCollaborators();
    } catch (err) {
      setCollabMessage(err instanceof Error ? err.message : "Failed to send collaboration invite");
    } finally {
      setCollabLoading(false);
    }
  };

  const handlePermissionChange = async (targetUserId: string, permission: "editor" | "viewer") => {
    if (!editId) return;

    try {
      const response = await fetch(`/api/posts/${editId}/collaborators`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "permission", userId: targetUserId, permission }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update permission");
      }

      await loadCollaborators();
      setCollabMessage("Permission updated.");
    } catch (err) {
      setCollabMessage(err instanceof Error ? err.message : "Failed to update permission");
    }
  };

  const handleRemoveCollaborator = async (targetUserId: string) => {
    if (!editId) return;

    try {
      const response = await fetch(`/api/posts/${editId}/collaborators?userId=${encodeURIComponent(targetUserId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove collaborator");
      }

      await loadCollaborators();
      setCollabMessage("Collaborator removed.");
    } catch (err) {
      setCollabMessage(err instanceof Error ? err.message : "Failed to remove collaborator");
    }
  };

  const handleInviteResponse = async (postId: string, action: "accept" | "reject") => {
    try {
      const response = await fetch("/api/collaboration/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update invite");
      }

      setIncomingInvites((prev) => prev.filter((invite) => invite.post_id !== postId));
      setCollabMessage(action === "accept" ? "Invite accepted." : "Invite rejected.");

      if (action === "accept") {
        router.push(`/editor?id=${postId}&collab=1`);
      }
    } catch (err) {
      setCollabMessage(err instanceof Error ? err.message : "Failed to update invite");
    }
  };
  
  const saveDraft = useCallback(async () => {
    if (!user || !title.trim()) return;
    setSaveStatus("saving");
    try {
      const url = isEditing && editId ? `/api/posts/${editId}` : "/api/posts";
      const method = isEditing && editId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 150),
          topic,
          category,
          cover_image_url: coverImageUrl || null,
          ai_generated: isAiGenerated,
          userId: user.id,
          published: false,
          status: "draft",
          blog_theme: blogTheme,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (isEditing === false && data.post?.id) {
          router.replace(`/editor?id=${data.post.id}`);
        }
        setSaveStatus("saved");
        setSuccess("Draft saved");
        setTimeout(() => setSaveStatus("unsaved"), 3000);
      }
    } catch (err) {
      setSaveStatus("unsaved");
      console.error("Auto-save failed:", err);
    }
  }, [title, content, excerpt, topic, category, coverImageUrl, isAiGenerated, blogTheme, user, isEditing, editId, router]);

  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      saveDraft();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [saveDraft]);

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="flex min-h-screen bg-[#1e1e1e] pt-16">
        {/* Main Editor */}
        <div className={`flex-1 flex flex-col ${showAISidebar ? "lg:mr-80" : ""} ${showPreview ? "lg:mr-96" : ""} transition-all`}>

          {/* WordPress-style top bar: back + title + publish buttons */}
          <div className="sticky top-16 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#23282d] px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </Button>
              <span className="hidden text-sm font-medium text-zinc-400 sm:block">Add a New Post</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saveStatus === "saving" && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check</span>Saved
                </span>
              )}
              <Badge variant="outline" className="hidden border-white/20 text-xs text-zinc-400 sm:flex">{wordCount} words</Badge>
              <Button
                variant={showPreview ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className={`h-8 gap-1.5 text-xs ${showPreview ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button
                variant={showAISidebar ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowAISidebar(!showAISidebar)}
                className={`h-8 gap-1.5 text-xs ${showAISidebar ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span className="hidden sm:inline">AI</span>
              </Button>
              <Button
                variant={showCollaboratorBlock ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowCollaboratorBlock(!showCollaboratorBlock)}
                className={`h-8 gap-1.5 text-xs ${showCollaboratorBlock ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span className="hidden sm:inline">Team</span>
              </Button>
              <Popover open={showThemePicker} onOpenChange={setShowThemePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-1.5 text-xs ${showThemePicker ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">palette</span>
                    <span className="hidden sm:inline">{getThemeById(blogTheme).previewImage} Theme</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-[#23282d] border-white/15 p-3" align="end">
                  <p className="text-xs font-bold text-zinc-300 mb-2">Choose Blog Theme</p>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availableThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => { setBlogTheme(theme.id); setShowThemePicker(false); }}
                        className={`rounded-lg border p-2 text-left transition-all ${
                          blogTheme === theme.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="text-lg mb-0.5">{theme.previewImage}</div>
                        <div className="text-[10px] font-semibold text-zinc-200 truncate">{theme.name}</div>
                        <div className="text-[8px] text-zinc-400 truncate">{theme.description}</div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                onClick={handlePublish}
                disabled={loading}
                size="sm"
                className="h-8 bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-lg shadow-blue-900/40"
              >
                {loading ? "Publishing..." : isEditing ? "Update" : "Publish"}
              </Button>
            </div>
          </div>

          {/* WordPress Add Media / Visual|Text bar */}
          <div className="sticky top-28 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#23282d] px-4 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <label className="flex cursor-pointer items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[15px] text-blue-400">add_photo_alternate</span>
                Add Media
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
              <button
                onClick={() => setShowCollaboratorBlock(!showCollaboratorBlock)}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-400">group_add</span>
                Collaborate
              </button>
              {writingTemplates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">description</span>
                  {template.label}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowPreview(false)}
                className={`rounded-l border border-white/15 px-3 py-1 text-xs font-medium transition-colors ${!showPreview ? "bg-white/15 text-white" : "bg-transparent text-zinc-400 hover:text-white"}`}
              >
                Visual
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`rounded-r border-y border-r border-white/15 px-3 py-1 text-xs font-medium transition-colors ${showPreview ? "bg-white/15 text-white" : "bg-transparent text-zinc-400 hover:text-white"}`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* WordPress-style format toolbar */}
          <div className="sticky top-[calc(64px+46px+40px)] z-30 border-b border-white/10 bg-[#2c2c2c]">
            {/* Row 1: Paragraph dropdown + main format buttons */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-white/5">
              {/* Paragraph/Heading dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-zinc-300 hover:bg-white/10 border border-white/15 mr-1">
                    Paragraph <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-44 bg-[#2c2c2c] border-white/15 p-1">
                  {[["Paragraph", ""], ["Heading 1", "\n# "], ["Heading 2", "\n## "], ["Heading 3", "\n### "], ["Heading 4", "\n#### "]].map(([lbl, md]) => (
                    <button
                      key={lbl}
                      onClick={() => md ? insertFormat(md, "") : null}
                      className="w-full text-left rounded px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
                    >{lbl}</button>
                  ))}
                </PopoverContent>
              </Popover>
              <TooltipProvider delayDuration={300}>
                {[
                  { icon: "format_bold", label: "Bold", action: () => insertFormat("**", "**") },
                  { icon: "format_italic", label: "Italic", action: () => insertFormat("*", "*") },
                  { icon: "format_strikethrough", label: "Strikethrough", action: () => insertFormat("~~", "~~") },
                  { icon: "format_list_bulleted", label: "Bullet List", action: () => insertFormat("\n- ", "") },
                  { icon: "format_list_numbered", label: "Numbered List", action: () => insertFormat("\n1. ", "") },
                  { icon: "format_quote", label: "Blockquote", action: () => insertFormat("\n> ", "") },
                  { icon: "format_align_left", label: "Align Left", action: () => insertFormat("", "") },
                  { icon: "format_align_center", label: "Center", action: () => insertFormat("<div align='center'>\n", "\n</div>") },
                  { icon: "format_align_right", label: "Align Right", action: () => insertFormat("<div align='right'>\n", "\n</div>") },
                  { icon: "link", label: "Link", action: () => insertFormat("[", "](url)") },
                  { icon: "table", label: "Table", action: () => insertFormat("\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n", "") },
                  { icon: "checklist", label: "Checklist", action: () => insertFormat("\n- [ ] Task 1\n- [ ] Task 2\n", "") },
                ].map((btn) => (
                  <Tooltip key={btn.icon}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={btn.action}
                        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-white/15 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">{btn.icon}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-black text-white">{btn.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            {/* Row 2: Secondary toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1">
              <TooltipProvider delayDuration={300}>
                {[
                  { icon: "format_clear", label: "Clear Format", action: () => insertFormat("", "") },
                  { icon: "horizontal_rule", label: "Divider", action: () => insertFormat("\n\n---\n\n", "") },
                  { icon: "code", label: "Inline Code", action: () => insertFormat("`", "`") },
                  { icon: "code_blocks", label: "Code Block", action: () => insertFormat("\n```\n", "\n```\n") },
                  { icon: "undo", label: "Undo", action: () => document.execCommand("undo") },
                  { icon: "redo", label: "Redo", action: () => document.execCommand("redo") },
                  { icon: "help", label: "Markdown Help", action: () => window.open("https://www.markdownguide.org/basic-syntax/", "_blank") },
                ].map((btn) => (
                  <Tooltip key={btn.icon}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={btn.action}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">{btn.icon}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-black text-white">{btn.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
              <span className="ml-auto text-[11px] text-zinc-500">{readTime} min read</span>
            </div>
          </div>

          {/* Editor Content - WordPress dark document layout */}
          <div className="flex-1 bg-[#1e1e1e] py-8 px-4 sm:px-10">
            <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
                <button onClick={() => setError("")} className="ml-auto"><span className="material-symbols-outlined text-sm">close</span></button>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {success}
              </div>
            )}

            {showCollaboratorBlock && (
              <Card className="mb-6 border-white/15 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/20">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">group</span>
                        Collaborator Toolkit
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Manage co-authors without leaving the editor.
                      </p>
                    </div>
                    {editId ? (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        Draft ID Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Save draft first to enable invites
                      </Badge>
                    )}
                  </div>

                  {collabFeedback && (
                    <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                      {collabFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Incoming Invites</p>
                      <div className="space-y-2">
                        {incomingInvites.length === 0 ? (
                          <p className="text-xs text-on-surface-variant">No pending collaboration invites.</p>
                        ) : (
                          incomingInvites.map((invite) => (
                            <div key={invite.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                              <p className="text-xs font-semibold text-on-surface line-clamp-1">{invite.posts?.title || "Untitled Draft"}</p>
                              <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                                Invited by {invite.inviter?.name || invite.inviter?.email || "Creator"}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleInviteResponse(invite.post_id, "reject")}>Reject</Button>
                                <Button size="sm" className="h-7 text-[11px]" onClick={() => handleInviteResponse(invite.post_id, "accept")}>Accept & Open</Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Draft Team</p>
                      {!editId ? (
                        <p className="text-xs text-on-surface-variant">Publish or save a draft first, then invite collaborators.</p>
                      ) : (
                        <>
                          {isPostOwner ? (
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-3">
                              <Input
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="teammate@email.com"
                                className="sm:col-span-3 bg-surface-container"
                              />
                              <select
                                value={invitePermission}
                                onChange={(e) => setInvitePermission(e.target.value === "viewer" ? "viewer" : "editor")}
                                className="sm:col-span-2 h-10 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <Button className="sm:col-span-1" disabled={collabLoading || !inviteEmail.trim()} onClick={handleInviteCollaborator}>
                                Invite
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface-variant mb-3">You can view collaborators here. Only owners can send invites.</p>
                          )}

                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {collabLoading ? (
                              <p className="text-xs text-on-surface-variant">Loading collaborators...</p>
                            ) : collaborators.length === 0 ? (
                              <p className="text-xs text-on-surface-variant">No collaborators yet.</p>
                            ) : (
                              collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-on-surface truncate">{collaborator.profiles?.name || collaborator.profiles?.email || collaborator.user_id}</p>
                                    <p className="text-[11px] text-on-surface-variant truncate">Status: {collaborator.status}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isPostOwner ? (
                                      <select
                                        value={collaborator.permission}
                                        onChange={(e) => handlePermissionChange(collaborator.user_id, e.target.value === "viewer" ? "viewer" : "editor")}
                                        className="h-7 rounded border border-input bg-background px-2 text-[11px]"
                                      >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                      </select>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">{collaborator.permission}</Badge>
                                    )}
                                    {isPostOwner && (
                                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleRemoveCollaborator(collaborator.user_id)}>
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full bg-transparent text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-white placeholder:text-zinc-700 outline-none mb-3 leading-tight border-b-2 border-blue-500/40 pb-4 focus:border-blue-400 transition-colors"
            />

            <div className="mb-5 flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Template:</span>
              {writingTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-colors"
                >
                  {template.label}
                </button>
              ))}
            </div>

            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Add a brief excerpt or subtitle..."
              className="w-full bg-transparent text-lg text-zinc-400 placeholder:text-zinc-700 outline-none mb-6 italic"
            />
            {/* Cover Image Preview */}
            {coverImageUrl && (
              <div className="relative mb-6 rounded-lg overflow-hidden group border border-white/10">
                <div className="relative w-full h-52">
                  <Image src={coverImageUrl} alt="Cover" fill className="object-cover" sizes="100vw" />
                </div>
                <button
                  onClick={() => setCoverImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="self-center text-[10px] font-bold uppercase tracking-wider text-zinc-700 mr-1">Insert:</span>
              <button onClick={() => insertFormat("\n## Key Takeaways\n", "")} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors">Key Takeaways</button>
              <button onClick={() => insertFormat("\n### Summary\n", "")} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors">Summary</button>
              <button onClick={() => insertFormat("\n- [ ] Task 1\n- [ ] Task 2\n", "")} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors">Checklist</button>
              <button onClick={() => insertFormat("\n| Metric | Result |\n| --- | --- |\n| Value | Value |\n", "")} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors">Table</button>
              <button onClick={() => insertFormat("\n> [!NOTE] ", "")} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors">Callout</button>
              <label className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">image</span>
                {uploadingInlineImage ? "Uploading..." : "Insert Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingInlineImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingInlineImage(true);
                    setSuccess("Uploading image...");
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("folder", "blog-inline");
                      const response = await fetch("/api/upload", { method: "POST", body: formData });
                      if (!response.ok) throw new Error("Upload failed");
                      const data = await response.json();
                      const textarea = contentRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const before = content.substring(0, start);
                        const after = content.substring(start);
                        const imgMd = `\n![image](${data.url})\n`;
                        setContent(before + imgMd + after);
                      }
                      setSuccess("Image inserted!");
                      setTimeout(() => setSuccess(""), 3000);
                    } catch (err) {
                      setError("Failed to upload image: " + String(err));
                    } finally {
                      setUploadingInlineImage(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>

            {/* WordPress-style bordered editor box */}
            <div className="rounded-sm border border-white/10 overflow-hidden">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Start writing your story here... (Type / for slash commands, Ctrl+V to paste images, Markdown supported)"
                className="w-full min-h-[55vh] bg-[#2a2a2a] p-5 text-zinc-100 placeholder:text-zinc-600 outline-none resize-none text-base leading-[1.85] font-mono"
              />
              {showSlashCommand && (
                <Popover open={showSlashCommand} onOpenChange={setShowSlashCommand}>
                  <PopoverTrigger asChild>
                    <div style={{ top: slashCommandPosition.top, left: slashCommandPosition.left, position: "absolute" }} />
                  </PopoverTrigger>
                  <PopoverContent className="w-48 bg-[#2c2c2c] border-white/15 p-1">
                    <div className="grid gap-1">
                      {slashCommands.map((command) => (
                        <button
                          key={command.label}
                          onClick={() => { command.action(); setShowSlashCommand(false); }}
                          className="w-full text-left rounded px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
                        >
                          {command.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {/* WordPress-style bottom word count bar */}
              <div className="border-t border-white/10 bg-[#232323] px-4 py-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Word count: {wordCount}</span>
                <span className="text-[11px] text-zinc-600">{readTime} min read</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        {showAISidebar && (
          <aside className="hidden lg:flex fixed right-0 top-16 w-80 h-[calc(100vh-64px)] flex-col bg-[#23282d] border-l border-white/10 z-20">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="font-bold font-headline">AI Assistant</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Powered by Gemini</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Actions */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Quick Actions</span>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={handleGenerateTitle}
                    disabled={generatingAI}
                    className="w-full justify-start gap-3 h-auto p-3"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">title</span>
                    Generate Title
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSummarize}
                    disabled={generatingAI}
                    className="w-full justify-start gap-3 h-auto p-3"
                  >
                    <span className="material-symbols-outlined text-secondary text-sm">summarize</span>
                    {generatingAI ? "Summarizing..." : "Summarize"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCheckTone}
                    disabled={generatingAI}
                    className="w-full justify-start gap-3 h-auto p-3"
                  >
                    <span className="material-symbols-outlined text-tertiary text-sm">psychology</span>
                    {generatingAI ? "Analyzing..." : "Check Tone"}
                  </Button>
                </div>
              </div>

              {/* Blog Category */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Blog Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-3 w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-primary"
                >
                  <option value="Technology">Technology</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Travel">Travel</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Business">Business</option>
                  <option value="Science">Science</option>
                  <option value="Art & Culture">Art & Culture</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              {/* Blog Theme Picker */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Blog Theme</span>
                <p className="text-[10px] text-on-surface-variant mt-1 mb-3">Choose a visual style for your published post</p>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {availableThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setBlogTheme(theme.id)}
                      className={`rounded-lg border p-2 text-left transition-all ${
                        blogTheme === theme.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="text-lg mb-1">{theme.previewImage}</div>
                      <div className="text-[11px] font-semibold text-on-surface truncate">{theme.name}</div>
                      <div className="text-[9px] text-on-surface-variant truncate">{theme.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Analysis Result */}
              {toneAnalysis && (
                <Card className="bg-surface-container border-none">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold">Tone Analysis</span>
                      <button onClick={() => setToneAnalysis(null)} className="text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant">{toneAnalysis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Full Generation */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Generate Full Article</span>
                <div className="mt-3 space-y-3">
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic..."
                    className="bg-surface-container border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary"
                  />
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-primary"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                    <option value="creative">Creative</option>
                  </select>
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={generatingAI}
                    className="w-full bg-linear-to-r from-secondary to-tertiary text-white font-bold hover:scale-[1.02] transition-all"
                  >
                    {generatingAI ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
              </div>

              {/* Cover Image Generation */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Cover Image</span>
                  <button
                    onClick={() => setUseAIImage(!useAIImage)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useAIImage ? "bg-primary" : "bg-surface-container-highest"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${useAIImage ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant mb-3">
                  {useAIImage ? "AI generates a cover image from your prompt" : "Upload an image from your device"}
                </p>
                <div className="space-y-3">
                  {useAIImage ? (
                    <>
                      <Input
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Image prompt (or uses title)..."
                        className="bg-surface-container border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary"
                      />
                      <Button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="w-full bg-linear-to-r from-primary to-secondary text-white font-bold hover:scale-[1.02] transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        {generatingImage ? "Generating..." : "Generate with AI"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <label className="w-full py-3 border-2 border-dashed border-outline-variant/30 rounded-lg text-sm text-on-surface-variant flex items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors">
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        {uploadingImage ? "Uploading..." : "Choose File"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                      </label>
                      <div className="text-[10px] text-on-surface-variant">Or paste a URL:</div>
                      <Input
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-surface-container border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary"
                      />
                    </>
                  )}
                  {coverImageUrl && (
                    <div className="rounded-lg overflow-hidden border border-outline-variant/20">
                      <div className="relative w-full h-32">
                        <Image src={coverImageUrl} alt="Cover preview" fill className="object-cover" sizes="400px" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Insights */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Live Insights</span>
                <div className="mt-3 space-y-3">
                  <Card className="bg-surface-container border-none">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">Readability</span>
                        <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px] h-5">Good</Badge>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest rounded-full">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: "78%" }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-surface-container border-none">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">SEO Score</span>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px] h-5">Fair</Badge>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest rounded-full">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: "55%" }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-surface-container border-none">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">Engagement</span>
                        <Badge variant="outline" className="text-primary border-primary/30 text-[10px] h-5">{wordCount > 300 ? "High" : "Low"}</Badge>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (wordCount / 500) * 100)}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Preview Panel */}
        {showPreview && (
          <aside className="hidden lg:flex fixed right-0 top-16 w-96 h-[calc(100vh-64px)] flex-col bg-surface-container-low border-l border-outline-variant/10 z-20 overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/10 sticky top-0 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h3 className="font-bold font-headline">Preview</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">How your post will look</p>
            </div>

            <div className={`flex-1 p-6 overflow-y-auto ${selectedTheme.bgClass} ${selectedTheme.fontClass}`}>
              {/* Preview Content */}
              <div className={`${selectedTheme.proseClass} max-w-none ${selectedTheme.textClass}`}>
                {/* Rendered Title */}
                <h1 className={`text-3xl font-bold mb-4 leading-tight ${selectedTheme.headingClass}`}>
                  {title || "Untitled Post"}
                </h1>

                {/* Cover Image Preview */}
                {coverImageUrl && (
                  <div className="rounded-lg overflow-hidden mb-6">
                    <div className="relative w-full h-40">
                      <Image
                        src={coverImageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/10">
                  <Badge className={`bg-current/10 ${selectedTheme.accentClass} text-xs`}>
                    {category}
                  </Badge>
                  <span className={`text-xs ${selectedTheme.textClass}`}>
                    {wordCount} words • {readTime} min read
                  </span>
                </div>

                {/* Excerpt */}
                {excerpt && (
                  <p className={`text-lg italic mb-6 leading-relaxed ${selectedTheme.textClass}`}>
                    {excerpt}
                  </p>
                )}

                {/* Rendered Markdown Content */}
                <div className={`${selectedTheme.textClass} leading-relaxed space-y-4`}>
                  {renderMarkdownBlocks(content, selectedTheme)}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
