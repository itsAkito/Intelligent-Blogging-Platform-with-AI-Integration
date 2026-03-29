"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import SideNavBar from "@/components/SideNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, UserPlus, Briefcase, FileText, Search } from "lucide-react";

interface CircleMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  isFollowing: boolean;
}

interface CircleReview {
  id: string;
  author: CircleMember;
  postTitle: string;
  postSlug: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface CircleJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  posted_at: string;
}

export default function InnerCirclePage() {
  return (
    <ProtectedRoute>
      <InnerCircleContent />
    </ProtectedRoute>
  );
}

function InnerCircleContent() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [reviews, setReviews] = useState<CircleReview[]>([]);
  const [jobs, setJobs] = useState<CircleJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/community/members?limit=20");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/community/reviews?limit=20");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "20");
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMembers(), fetchReviews(), fetchJobs()]).finally(() => setLoading(false));
  }, [fetchMembers, fetchReviews, fetchJobs]);

  const handleFollowUser = async (memberId: string, isFollowing: boolean) => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/follows/${memberId}`, { method });
      if (res.ok) {
        setMembers(
          members.map(m =>
            m.id === memberId ? { ...m, isFollowing: !isFollowing } : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  };

  const handlePostReview = async (postSlug: string, rating: number, comment: string) => {
    try {
      const res = await fetch("/api/community/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, rating, comment }),
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error("Failed to post review:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navbar />
      <SideNavBar activePage="inner-circle" />

      <main className="flex-1 lg:ml-64 pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">people</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold font-headline text-on-surface">
                  Inner Circle
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Connect, learn, and grow with our community
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-surface-container border border-outline-variant/10 rounded-full p-1 h-auto mb-8">
              <TabsTrigger
                value="members"
                className="rounded-full text-xs px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-sm mr-2">person_add</span>
                Members
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-full text-xs px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-sm mr-2">rate_review</span>
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="rounded-full text-xs px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-sm mr-2">work</span>
                Jobs
              </TabsTrigger>
              <TabsTrigger
                value="resume"
                className="rounded-full text-xs px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-sm mr-2">description</span>
                Resume
              </TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            {activeTab === "members" && <MembersSection members={members} onFollowUser={handleFollowUser} loading={loading} />}

            {/* Reviews Tab */}
            {activeTab === "reviews" && <ReviewsSection reviews={reviews} loading={loading} onPostReview={handlePostReview} />}

            {/* Jobs Tab */}
            {activeTab === "jobs" && (
              <JobsSection
                jobs={jobs}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                loading={loading}
              />
            )}

            {/* Resume Tab */}
            {activeTab === "resume" && <ResumeSection />}
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function MembersSection({
  members,
  onFollowUser,
  loading,
}: {
  members: CircleMember[];
  onFollowUser: (id: string, isFollowing: boolean) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map(member => (
        <Card key={member.id} className="bg-surface-container border-outline-variant/10 hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant={member.isFollowing ? "outline" : "default"}
                onClick={() => onFollowUser(member.id, member.isFollowing)}
                className="h-8 px-3 text-xs"
              >
                {member.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
            <h3 className="font-bold text-sm text-on-surface mb-1">{member.name}</h3>
            {member.role && (
              <Badge variant="outline" className="mb-3 text-[10px]">
                {member.role}
              </Badge>
            )}
            {member.bio && (
              <p className="text-xs text-on-surface-variant line-clamp-2">{member.bio}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewsSection({
  reviews,
  loading,
  onPostReview,
}: {
  reviews: CircleReview[];
  loading: boolean;
  onPostReview: (postSlug: string, rating: number, comment: string) => void;
}) {
  const [ratingForm, setRatingForm] = useState({ postSlug: "", rating: 5, comment: "" });

  const handleSubmitReview = async () => {
    if (!ratingForm.postSlug.trim() || !ratingForm.comment.trim()) return;
    await onPostReview(ratingForm.postSlug, ratingForm.rating, ratingForm.comment);
    setRatingForm({ postSlug: "", rating: 5, comment: "" });
  };

  return (
    <div className="space-y-6">
      {/* Post Review Section */}
      <Card className="bg-surface-container border-outline-variant/10">
        <CardHeader>
          <CardTitle className="text-lg">Share Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter post slug or title"
            value={ratingForm.postSlug}
            onChange={e => setRatingForm({ ...ratingForm, postSlug: e.target.value })}
            className="bg-surface-container-low border-outline-variant/20"
          />
          <div>
            <label className="text-sm text-on-surface-variant mb-2 block">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setRatingForm({ ...ratingForm, rating: i })}
                  className={`text-2xl transition-colors ${
                    i <= ratingForm.rating ? "text-yellow-400" : "text-on-surface-variant"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Share your thoughts..."
            value={ratingForm.comment}
            onChange={e => setRatingForm({ ...ratingForm, comment: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50"
          />
          <Button onClick={handleSubmitReview} className="w-full">
            Post Review
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-bold text-on-surface">Latest Reviews</h3>
        {reviews.map(review => (
          <Card key={review.id} className="bg-surface-container border-outline-variant/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.author.avatar_url} />
                  <AvatarFallback>{review.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{review.author.name}</p>
                      <Link
                        href={`/blog/${review.postSlug}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {review.postTitle}
                      </Link>
                    </div>
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">{review.comment}</p>
                  <p className="text-xs text-on-surface-variant/50 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function JobsSection({
  jobs,
  searchQuery,
  setSearchQuery,
  loading,
}: {
  jobs: CircleJob[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-on-surface-variant w-5 h-5" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-12 bg-surface-container border-outline-variant/20"
        />
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job.id} className="bg-surface-container border-outline-variant/10 hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-on-surface mb-1">{job.title}</h3>
                  <p className="text-sm text-on-surface-variant">{job.company}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {job.type}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 mb-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">attach_money</span>
                    {job.salary}
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{job.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResumeSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">Your Resume</h2>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Edit Resume
        </Button>
      </div>

      <Card className="bg-surface-container border-outline-variant/10">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">description</span>
          </div>
          <h3 className="font-bold text-on-surface mb-2">Build Your Resume</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Create a professional resume to showcase your skills and experience
          </p>
          <Button>
            {/* Link to /dashboard/resume */}
            Start Building
          </Button>
        </CardContent>
      </Card>

      {/* Resume Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Modern", "Classic", "Minimal"].map(template => (
          <Card key={template} className="bg-surface-container border-outline-variant/10 cursor-pointer hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="w-full h-32 rounded-lg bg-surface-container-low mb-4 flex items-center justify-center">
                <span className="text-on-surface-variant text-sm">Preview</span>
              </div>
              <h4 className="font-semibold text-on-surface mb-2">{template}</h4>
              <Button size="sm" className="w-full">
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
