# AiBlog

AiBlog is an AI-focused publishing, career, and community platform. It combines a multi-author blog, creator tools, research discovery, jobs, forum discussions, and an admin CMS so the site can operate like a modern digital magazine instead of only a simple blog.

## Purpose

This website is built to do four things in one product:

1. Help creators publish AI, technology, and career-focused content.
2. Give readers one place to discover articles, research papers, global innovation news, jobs, and community discussions.
3. Give users career-growth tools such as resumes, portfolios, analytics, and guided paths.
4. Give administrators a working content-management system to review, moderate, and control the full platform.

In practical terms, AiBlog is a hybrid of an AI magazine, creator platform, career hub, and admin-managed CMS.

## What The Platform Includes

### Reader Experience

- Public landing page with featured stories, research signals, world AI news, and forum activity.
- Blog reading experience with comments, likes, share actions, and engagement tracking.
- Innovation feed that aggregates research papers, journal content, and world technology news.
- Jobs and career discovery sections.
- Community and forum surfaces for discussion and collaboration.

### Creator Experience

- Protected dashboard for writers and community members.
- Editor for drafting, publishing, and updating posts.
- My Posts area for managing owned content.
- Resume builder, portfolio, analytics, notifications, and collaboration tools.
- AI-assisted content workflows and AI-derived insights in selected views.

### Admin Experience

- Admin-only login flow and protected admin routes.
- System overview dashboard.
- User management.
- Content moderation for posts and comments.
- Blog CMS page for managing all posts across the platform.
- Analytics and configuration views.

## Core Product Vision

AiBlog is not just a publishing tool. The product is designed as a controlled ecosystem where:

- writers create AI and career content,
- readers consume blog posts and research-backed information,
- professionals discover opportunities and build their profile,
- the community contributes discussion and insight,
- admins manage quality, safety, and platform operations.

That makes the platform suitable for an AI media brand, a career-growth publication, or a community-led magazine product.

## Main Modules

### 1. Blogging System

- Create, edit, publish, and delete posts.
- Draft and published post states.
- Slug-based blog pages.
- Engagement support with likes, comments, and sharing.

### 2. Research And Innovation Feed

- Aggregated AI and technology research streams.
- In-app reading modal for research and news items.
- External source links for original papers and articles.
- Innovation landing page for research, news, and community context.

### 3. Career Platform

- Job discovery.
- Career paths and growth tracking.
- Portfolio and resume tools.
- User insights and dashboard utilities.

### 4. Community And Forum

- Community feed.
- Forum discussions with topics and replies.
- Commenting and collaboration surfaces.

### 5. CMS And Administration

- Admin authentication.
- User restrictions between normal users and admins.
- Admin content moderation.
- Admin post deletion and full-post visibility.
- Platform activity and analytics.

## Roles

### User

- Can sign in, write posts, manage their own content, use dashboard tools, and participate in the community.
- Cannot access admin pages or admin-only CMS actions.

### Admin

- Can access the admin panel after successful admin login.
- Can review users, moderation queues, analytics, and full blog inventory.
- Can delete posts and comments at the platform level.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Clerk authentication
- Supabase for data storage and server access
- React Context for app and auth state
- Lucide React and Material Symbols for icons

## Important Areas In The Codebase

```text
app/
  admin/                 Admin dashboard, moderation, analytics, CMS pages
  api/                   Route handlers for auth, posts, admin, innovation, jobs, forum, etc.
  blog/                  Blog reader pages
  dashboard/             Authenticated user workspace
  editor/                Post editor and publishing flow
  innovation/            Research and world-news experience

components/
  AdminSideNav.tsx       Admin navigation
  AdminTopNav.tsx        Admin top navigation
  NavBar.tsx             Global site navigation
  ConsentModal.tsx       Post-login consent flow

context/
  AuthContext.tsx        Unified Clerk, OTP, and admin-session auth state

lib/
  admin-auth.ts          Admin helpers
  auth-helpers.ts        Shared auth resolution helpers
  activity-log.ts        Activity logging

utils/
  supabase/              Supabase client helpers
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Supabase configuration
- Clerk configuration

### Run The App

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Environment Notes

The app expects environment variables for:

- Clerk auth
- Supabase URL and keys
- Admin email and password
- External integrations such as jobs or news feeds when enabled

## Why This Website Was Built

The product direction behind AiBlog is clear: build a platform where AI content, research, careers, and community are connected instead of scattered across separate websites. A user should be able to read a blog post, check supporting research, discuss the topic, discover jobs, and build career assets inside the same ecosystem. At the same time, admins need enough control to run the platform like a real publication.

That is the main purpose of the website today.
