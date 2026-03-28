# AiBlog - AI-Powered Blogging & Career Platform

A professional-grade blogging and career development platform built with cutting-edge web technologies and AI integration.

## 🚀 Features

- **Landing Page**: High-impact hero section with platform statistics and featured stories
- **Creator Dashboard**: Analytics-heavy view with growth pulse charts and career milestones
- **AI Editor Canvas**: Distraction-free writing interface with intelligent content assistance
- **Community Feed**: Post cards with engagement metrics and social interactions
- **Career Tracking**: Milestone progress and professional growth tracking
- **Responsive Design**: Mobile-first approach with full responsiveness

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API
- **Database Ready**: Structured for MongoDB/Node.js integration

## 📋 Project Structure

```
aiblog/
├── app/
│   ├── layout.tsx          # Root layout with font configuration
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles and Tailwind directives
│   └── [pages]/            # Future route pages
├── components/
│   ├── TopNavBar.tsx       # Navigation header
│   ├── SideNavBar.tsx      # Sidebar navigation
│   ├── PostCard.tsx        # Post component
│   ├── StatCard.tsx        # Statistics card
│   └── AIAssistantSidebar.tsx  # AI assistant sidebar
├── context/
│   └── AppContext.tsx      # Global state management
├── tailwind.config.ts      # Tailwind configuration with custom colors
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## 🎨 Design System

### Color Palette
- **Primary**: #85adff (Electric Blue)
- **Secondary**: #c180ff (Purple)
- **Surface**: #0e0e0e (Deep Navy)
- **On-Surface**: #ffffff (White)

### Typography
- **Headlines**: Manrope (400, 500, 600, 700, 800)
- **Body**: Inter (400, 500, 600)
- **Labels**: Inter (400, 500, 600)

### Components
- Glassmorphic panels with 24px blur
- Custom border radius: 0.25rem (default), 0.5rem (lg), 0.75rem (xl)
- Dark mode by default

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Dependencies

- **react**: UI library
- **next**: React framework with App Router
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS
- **framer-motion**: Animation library
- **lucide-react**: Icon library

## 🔧 Configuration

### Tailwind CSS
Custom colors and typography are configured in `tailwind.config.ts` with a comprehensive Material Design 3 inspired color system.

### TypeScript
Strict type checking is enabled with path aliases (`@/*`) for clean imports.

### ESLint
Next.js recommended rules are extended for code quality.

## 🌊 State Management

The app uses React Context API for global state management:
- **AppContext**: Manages navigation state, theme, and user statistics

To use the context in components:

```typescript
import { useApp } from "@/context/AppContext";

export default function Component() {
  const { activeNav, setActiveNav, userStats } = useApp();
  // ...
}
```

## 📱 Responsive Design

All components follow a mobile-first approach with breakpoints:
- Mobile: 0px
- Tablet: 768px (md)
- Desktop: 1024px (lg)
- Large Desktop: 1280px (xl)

## 🔐 Security & Performance

- CSS isolation with Tailwind CSS
- Optimized images with Next.js Image component
- Font optimization with next/font
- Type safety with TypeScript

## 📝 Development Guidelines

- Use semantic HTML elements
- Follow BEM naming conventions for custom CSS
- Keep components small and focused
- Utilize Tailwind CSS utilities for styling
- Maintain TypeScript strict mode
- Use absolute imports (@/*) for clean paths

## 🚢 Deployment

Ready for deployment on:
- Vercel (recommended)
- Netlify
- AWS
- Self-hosted with Node.js

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue on the GitHub repository.

---

**AiBlog** - Elevating Editorial Excellence with AI
