"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { renderMarkdownBlocks } from "@/lib/markdown";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  topic?: string;
  views: number;
  likes_count: number;
  comments_count: number;
  liked_by_current_user?: boolean;
  ai_generated: boolean;
  created_at: string;
  profiles?: { id: string; name: string; avatar_url?: string };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  profiles?: { id: string; name: string; avatar_url?: string } | null;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState("");
  const [liked, setLiked] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
        setLiked(!!data.liked_by_current_user);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchComments = useCallback(async () => {
    if (!post?.id) return;
    try {
      const res = await fetch(`/api/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }, [post?.id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLike = async () => {
    if (!post) return;
    if (!user) {
      alert("Please sign in to like this post");
      return;
    }
    try {
      if (liked) {
        // Unlike
        const res = await fetch(`/api/likes?post_id=${post.id}`, { method: "DELETE" });
        if (res.ok) {
          const data = await res.json();
          setLiked(false);
          setPost({ ...post, likes_count: data.count ?? Math.max(0, post.likes_count - 1) });
        }
      } else {
        // Like
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiked(true);
          setPost({ ...post, likes_count: data.count ?? post.likes_count + 1 });
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to toggle like. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    if (!user && (!guestName.trim() || !guestEmail.trim())) return;
    if (!post?.id) {
      alert("Post is still loading. Please wait.");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          content: commentContent,
          guestName: user ? undefined : guestName,
          guestEmail: user ? undefined : guestEmail,
        }),
      });

      if (res.ok) {
        const { comment } = await res.json();
        setComments([...comments, comment]);
        setPost((prev) => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
        setCommentContent("");
        setCommentSuccess("Comment posted!");
        setTimeout(() => setCommentSuccess(""), 3000);
      } else {
        let errorMessage = "Unknown error";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || `Server error (${res.status})`;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Server error (${res.status}): Unable to parse error response`;
        }
        alert(`Failed to post comment: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Comment submission error:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-24 px-4 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-primary"></div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-24 px-4 text-center">
          <h1 className="text-3xl font-bold font-headline mt-20">Post Not Found</h1>
          <p className="text-on-surface-variant mt-4">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/community" className="mt-6 inline-block text-primary font-semibold hover:underline">
            Browse All Posts
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-16">
        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="w-full h-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background z-10"></div>
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <header className={`${post.cover_image_url ? "-mt-24 relative z-20" : "mt-8"}`}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/community" className="text-on-surface-variant hover:text-primary text-sm transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                All Posts
              </Link>
              {post.topic && (
                <>
                  <span className="text-on-surface-variant/30">/</span>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {post.topic}
                  </span>
                </>
              )}
              {post.ai_generated && (
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">auto_awesome</span>
                  AI Generated
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-on-surface leading-tight mb-6">
              {post.title}
            </h1>

            {/* Author & Meta */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-8 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-sm text-on-surface">{post.profiles?.name || "Unknown"}</span>
                  <span className="block text-xs text-on-surface-variant">{formatDate(post.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  {post.views} views
                </span>
                <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${liked ? "text-red-400" : "hover:text-red-400"}`}>
                  <span className="material-symbols-outlined text-sm" style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                  {post.likes_count} likes
                </button>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                  {post.comments_count || comments.length} comments
                </span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mt-10 prose prose-invert prose-lg max-w-none text-on-surface-variant leading-relaxed">
            {renderMarkdownBlocks(post.content)}
          </div>

          {/* Comments Section */}
          <section className="mt-16 pt-10 border-t border-outline-variant/10">
            <h2 className="text-2xl font-bold font-headline mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">forum</span>
              Comments ({comments.length})
            </h2>

            {/* Comment Form */}
            <div className="glass-panel rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-sm mb-4">
                {user ? "Leave a comment" : "Leave a comment as a guest"}
              </h3>
              <form onSubmit={handleSubmitComment} className="space-y-4">
                {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your name *"
                      required
                      className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50"
                    />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Your email *"
                      required
                      className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50"
                    />
                  </div>
                )}
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write your comment..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    {user ? `Commenting as ${user.email}` : "Your email won't be published"}
                  </span>
                  <button
                    type="submit"
                    disabled={submittingComment || loading || !post?.id}
                    className="px-6 py-2.5 bg-linear-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-lg text-sm hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {submittingComment ? "Posting..." : loading || !post?.id ? "Loading..." : "Post Comment"}
                  </button>
                </div>
                {commentSuccess && (
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {commentSuccess}
                  </p>
                )}
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">forum</span>
                  <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="glass-panel rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-sm">person</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-on-surface">
                            {comment.profiles?.name || comment.guest_name || "Anonymous"}
                          </span>
                          {comment.guest_name && !comment.user_id && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">Guest</span>
                          )}
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
