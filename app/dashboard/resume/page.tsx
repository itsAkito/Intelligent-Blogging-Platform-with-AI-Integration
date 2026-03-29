"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/NavBar";
import SideNavBar from "@/components/SideNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Save, X } from "lucide-react";

interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description: string;
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
  location: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    // Load resume from localStorage
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      try {
        setResumeData(JSON.parse(saved));
      } catch {
        console.error("Failed to parse saved resume data");
      }
    }
  }, []);

  const handleSaveResume = () => {
    localStorage.setItem("resumeData", JSON.stringify(resumeData));
    setEditing(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setResumeData({
        ...resumeData,
        skills: [...resumeData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((_, i) => i !== index),
    });
  };

  const handleDownloadPDF = () => {
    alert("PDF download feature coming soon!");
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-black text-white">
        <SideNavBar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-bold">Resume Builder</h1>
                  <p className="text-gray-400 mt-2">Create and manage your professional resume</p>
                </div>
                <div className="flex gap-3">
                  {!editing ? (
                    <>
                      <Button
                        onClick={() => setEditing(true)}
                        className="bg-white text-black hover:bg-gray-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleSaveResume}
                      className="bg-green-600 text-white hover:bg-green-500"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Resume
                    </Button>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-300">Full Name</label>
                          <Input
                            value={resumeData.fullName}
                            onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                            className="bg-black border-gray-700 text-white mt-1"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-300">Email</label>
                          <Input
                            value={resumeData.email}
                            onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                            className="bg-black border-gray-700 text-white mt-1"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-300">Phone</label>
                          <Input
                            value={resumeData.phone}
                            onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                            className="bg-black border-gray-700 text-white mt-1"
                            placeholder="Your phone number"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-300">Location</label>
                          <Input
                            value={resumeData.location}
                            onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                            className="bg-black border-gray-700 text-white mt-1"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300">Professional Summary</label>
                        <Textarea
                          value={resumeData.summary}
                          onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                          className="bg-black border-gray-700 text-white mt-1"
                          placeholder="Brief overview of your professional background and goals"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                          className="bg-black border-gray-700 text-white"
                          placeholder="Add a skill (e.g., React, Python)"
                        />
                        <Button
                          onClick={handleAddSkill}
                          className="bg-blue-600 text-white hover:bg-blue-500"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-blue-600 text-white cursor-pointer"
                            onClick={() => handleRemoveSkill(index)}
                          >
                            {skill}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coming Soon Notice */}
                  <Card className="bg-gray-900 border-gray-700 opacity-50">
                    <CardHeader>
                      <CardTitle className="text-gray-400">Experience & Education</CardTitle>
                      <CardDescription className="text-gray-500">Coming soon - You'll be able to add work experience and education details</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{resumeData.fullName}</h2>
                        <div className="text-gray-400 text-sm mt-1">
                          {resumeData.location && <p>{resumeData.location}</p>}
                          {resumeData.email && <p>{resumeData.email}</p>}
                          {resumeData.phone && <p>{resumeData.phone}</p>}
                        </div>
                      </div>

                      {resumeData.summary && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Professional Summary</h3>
                          <p className="text-gray-300">{resumeData.summary}</p>
                        </div>
                      )}

                      {resumeData.skills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {resumeData.skills.map((skill, index) => (
                              <Badge key={index} className="bg-blue-600 text-white">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
