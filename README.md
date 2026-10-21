# ClipForge AI — Intelligent Short-Form Video Repurposing Studio

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev)

**ClipForge AI** is a complete, modern, responsive AI video clipping web application inspired by the workflow and usability of Picsart AI Video Clipping and OpusClip. It enables video creators, podcasters, educators, and social media teams to transform long-form recordings into scroll-stopping 9:16 vertical shorts, customize kinetic captions, trim timestamps on an interactive timeline, and export ready-to-publish assets.

---

## 🚀 Key Features & Capabilities

- **🎙️ Long-Form Video Ingestion & Metadata Extraction:**
  - Browser-native drag-and-drop file upload (MP4, MOV, WebM up to 1.5 GB).
  - Instant metadata inspection: duration, frame width/height, aspect ratio, file size, and automatic thumbnail generation via HTML5 `<canvas>`.
  - Built-in sample video picker (Podcast, Founder Interview, Tech Tutorial) for immediate 1-click testing without needing local files.

- **⚙️ Advanced Clip Configuration Studio:**
  - **Clip Quantity:** 3, 5, 10, or custom count.
  - **Target Duration:** 15–30s, 30–60s, 60–90s, or custom seconds.
  - **Aspect Ratio Reframing:** Visual selectors for 9:16 Vertical (TikTok/Reels/Shorts), 16:9 Landscape (YouTube/LinkedIn), 1:1 Square (Instagram Feed), and Original.
  - **Content Categorization:** Specialized algorithms for Podcasts, Interviews, Tutorials, Webinars, Keynotes, and Vlogs.
  - **Highlight Priorities:** Focus on strong opening hooks, educational moments, contrarian explanations, humorous peaks, or emotional stories.
  - **Kinetic Subtitle Presets:** Hormozi Bold (yellow keywords), Electric Karaoke (cyan glow), Minimal Clean, Neon Glow, and Cinematic Letterbox.

- **🔄 Simulated 6-Stage AI Processing Pipeline:**
  - Transparent state machine stepping through:
    1. *Preparing Video* (container validation & audio stream decoding)
    2. *Analyzing Content* (transcription & semantic tokenization)
    3. *Identifying Highlights* (hook curiosity scoring & retention curve)
    4. *Creating Clip Segments* (timestamp calculation & 9:16 framing)
    5. *Preparing Captions* (kinetic word synchronization & styling)
    6. *Finalizing Previews* (generating clip cards & saving state)
  - Cancelable pipeline and retry mechanisms.

- **🎛️ Dedicated Individual Clip Editor:**
  - Full-featured HTML5 video player with play/pause (Spacebar shortcut), volume, looping, and fullscreen.
  - **Live Synchronized Caption Overlay:** Animates and highlights words in real-time matching the video playback time.
  - **Interactive Dual-Handle Timeline Trimmer:** Drag start and end handles, scrub the playhead across the video ruler, and use ±0.2s and ±1.0s micro-steppers for surgical cuts.
  - **Subtitle Segment Editor:** Edit caption text, adjust sentence timecodes, add new lines, or remove lines.
  - **Viral Metadata & Tag Editor:** Title, description, and hashtag pills.

- **📥 Realistic Export Hub:**
  - **SubRip (.SRT)** word-synchronized subtitle downloads for Premiere Pro, DaVinci Resolve, or CapCut.
  - **WebVTT (.VTT)** web caption downloads.
  - **Project Data (.JSON)** export containing exact timestamps and viral scores.
  - Honest disclosure: Direct GPU-rendered MP4 video generation requires an external Python/FFmpeg backend service.

- **💾 Local Persistence & State Management:**
  - Zustand-powered stores (`useProjectStore`, `useAuthStore`, `useSettingsStore`, `useToastStore`).
  - Persistent browser storage with seed demo projects for immediate exploration.
  - Graceful error states, empty states, and responsive navigation drawer for mobile & tablet devices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) with custom dark navy tokens |
| **Icons** | [Lucide React](https://lucide.react.dev/) |
| **Routing** | [React Router 6](https://reactrouter.com/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Storage** | LocalStorage + HTML5 Blob URLs |

---

## 📂 Project Structure

```text
c:\Users\onyen\Desktop\Kingship\CLIP
├── index.html                     # Application HTML entry point & SEO meta
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS plugins
├── tailwind.config.js             # Theme tokens, custom dark navy colors, glow shadows
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite bundler configuration & path aliases
├── .env.example                   # Environment configuration template
├── README.md                      # Comprehensive project documentation
└── src
    ├── App.tsx                    # Routes, route guards, and AppShell wrapper
    ├── main.tsx                   # React root renderer
    ├── index.css                  # Tailwind directives, custom scrollbars, text shadows
    ├── types                      # Complete TypeScript definitions
    │   └── index.ts               # VideoMetadata, Project, Clip, Job, Settings
    ├── utils                      # Formatting and browser media utilities
    │   ├── formatters.ts          # Timecodes (HH:MM:SS.m), file sizes, dates
    │   ├── videoHelpers.ts        # Canvas thumbnail extractor, sample videos, SRT/VTT/JSON exporters
    │   └── storage.ts             # LocalStorage & demo seed project data
    ├── services                   # Typed service interfaces & implementation
    │   └── clippingService.ts     # IClippingService, DemoClippingService, pipeline stages
    ├── store                      # Zustand state stores
    │   ├── useAuthStore.ts        # Demo authentication & user profile state
    │   ├── useProjectStore.ts     # Project CRUD, clip editing, selections, jobs
    │   ├── useSettingsStore.ts    # User defaults & storage resets
    │   └── useToastStore.ts       # Global auto-dismissing notifications
    ├── components
    │   ├── common                 # Reusable UI primitives
    │   │   ├── Button.tsx         # Primary, secondary, outline, ghost, danger
    │   │   ├── Input.tsx          # Inputs with labels, icons, errors
    │   │   ├── Select.tsx         # Styled native dropdowns
    │   │   ├── Checkbox.tsx       # Accessible checkbox controls
    │   │   ├── Slider.tsx         # Range inputs
    │   │   ├── Modal.tsx          # Accessible modal dialog with backdrop
    │   │   ├── Dialog.tsx         # Confirmation dialogs (delete, reset)
    │   │   ├── ToastContainer.tsx # Floating notification stack
    │   │   ├── Badge.tsx          # Status, aspect ratio, and viral badges
    │   │   └── EmptyState.tsx     # Empty state, error state, loading skeleton
    │   ├── layout                 # App structure & shell
    │   │   ├── AppShell.tsx       # Main authenticated workspace wrapper
    │   │   ├── Sidebar.tsx        # Collapsible navigation sidebar & mobile drawer
    │   │   ├── Header.tsx         # Sticky header with breadcrumbs & guide modal
    │   │   └── DemoBanner.tsx     # Top banner explaining local demo simulation
    │   ├── upload                 # File upload & metadata
    │   │   ├── UploadDropzone.tsx # Drag-and-drop video upload
    │   │   ├── SampleVideoPicker.tsx # 1-click sample podcast/interview loader
    │   │   └── VideoMetadataPanel.tsx # Extracted video resolution, duration, format
    │   ├── config                 # Project configuration
    │   │   ├── AspectRatioSelector.tsx # Visual cards for 9:16, 16:9, 1:1, original
    │   │   └── ClipConfigurationForm.tsx # Tabs for clip count, captions, resolution
    │   ├── processing             # Video processing pipeline
    │   │   └── ProcessingProgress.tsx # Real-time 6-stage animated progress
    │   ├── gallery                # Project workspace & clips
    │   │   ├── ClipCard.tsx       # Card with video thumbnail, viral score, actions
    │   │   ├── ClipGallery.tsx    # Grid/list view, search, sort, filter, bulk export
    │   │   └── ClipPreviewModal.tsx # Fast in-gallery playback
    │   ├── editor                 # Individual clip editing studio
    │   │   ├── VideoPlayer.tsx    # Aspect-ratio container with controls
    │   │   ├── CaptionOverlay.tsx # Synchronized kinetic text overlay
    │   │   ├── ClipTimeline.tsx   # Dual-handle range trimmer with micro-steppers
    │   │   ├── CaptionEditorPanel.tsx # Subtitle timing and text list
    │   │   ├── ClipMetadataEditor.tsx # Viral scores, titles, hashtags
    │   │   └── ExportDialog.tsx   # SRT, VTT, JSON, and MP4 downloads
    │   └── landing                # Marketing presentation
    │       ├── LandingNavbar.tsx  # Responsive marketing navigation
    │       ├── HeroSection.tsx    # Headline, CTA, interactive workspace mockup
    │       ├── WorkflowSection.tsx # 4-step workflow cards
    │       ├── FeatureCards.tsx   # Product features
    │       ├── RepurposeComparison.tsx # Before/after content comparison
    │       ├── RatioShowcase.tsx  # Social aspect ratios showcase
    │       ├── ExampleClipGallery.tsx # Playable curated sample clips
    │       ├── PricingSection.tsx # Starter, Pro Creator, Agency tiers
    │       ├── FAQSection.tsx     # Interactive FAQ accordion
    │       └── LandingFooter.tsx  # Footer with links and copyright
    └── pages
        ├── LandingPage.tsx        # / (Marketing homepage)
        ├── LoginPage.tsx          # /login (Sign-in)
        ├── SignupPage.tsx         # /signup (Registration)
        ├── DashboardPage.tsx      # /dashboard (Main overview & instant dropzone)
        ├── NewProjectPage.tsx     # /dashboard/new (Upload & configure workflow)
        ├── ProjectLibraryPage.tsx # /dashboard/projects (Project management)
        ├── ProjectWorkspacePage.tsx # /dashboard/projects/:id (Clip results gallery)
        ├── ClipEditorPage.tsx     # /dashboard/clips/:id (Individual video editor)
        ├── SettingsPage.tsx       # /settings (User preferences & storage)
        └── NotFoundPage.tsx       # 404 (Not found fallback)
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node `v24.21.0`).
- **npm**: `v9.0.0` or higher (tested on npm `v12.0.2`).

### 1. Installation

Clone or open the project folder in your terminal, then install dependencies:

```bash
npm install
```

### 2. Development Server

Start the local Vite development server:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Production Build

To create an optimized production build:

```bash
npm run build
```

The compiled assets will be output to the `dist/` folder.

### 4. Preview Production Build

To test and preview the production build locally:

```bash
npm run preview
```

---

## 🧭 Routes & Navigation Guide

| Route | Page | Purpose |
|---|---|---|
| `/` | **Landing Page** | Marketing presentation with visual studio mockup, features, pricing, FAQ |
| `/login` | **Sign In** | Demo authentication with 1-click instant login |
| `/signup` | **Sign Up** | Registration interface with client validation |
| `/dashboard` | **Dashboard** | Studio home with large upload dropzone, recent projects, and recent clips |
| `/dashboard/new` | **New Project** | Video upload, metadata extraction, and multi-tab clipping configuration |
| `/dashboard/projects` | **Project Library** | Filter, sort, rename, duplicate, and delete video projects |
| `/dashboard/projects/:id` | **Project Workspace** | Generated clips gallery, bulk actions, and export hub |
| `/dashboard/clips/:id` | **Clip Editor** | HTML5 video player, dual-handle timeline trimmer, synchronized caption editor |
| `/settings` | **Settings** | Default aspect ratios, default durations, caption presets, and reset storage |
| `*` | **404 Not Found** | Custom styled page with navigation back to studio |

---

## 💡 Demo Functionality & Technical Transparency

To provide an immediate, hands-on pair programming and testing experience:

1. **Client-Side Simulation:**
   - All video file handling, duration calculation, and frame extraction occur directly in the browser via native HTML5 `<video>` and `<canvas>` APIs.
   - The multi-stage AI pipeline (*Preparing Video → Analyzing Content → Identifying Highlights → Creating Segments → Preparing Captions → Finalizing Previews*) is driven by a state machine that accurately models real job progress without making unauthorized external network calls.
2. **Instant Preloaded Media:**
   - If you do not have an MP4 file handy, click on any of the preloaded sample videos (*AI Podcast*, *Founder Interview*, or *Tech Tutorial*) on the Dashboard or New Project page to test the entire clipping and editing experience in 1 click.
3. **Working Real Downloads:**
   - **SubRip Subtitles (.SRT):** Generates and downloads real `.srt` files matching the exact clip timestamps.
   - **WebVTT Captions (.VTT):** Generates real `.vtt` caption tracks.
   - **Project Data (.JSON):** Exports complete machine-readable project metadata and clip coordinates.
4. **Distinction from Backend Rendering:**
   - Client-side browsers cannot perform heavy GPU-accelerated H.264 video encoding with burned-in fonts without a dedicated backend or 50MB+ WebAssembly FFmpeg bundles.
   - The export dialog explicitly notifies the user of this boundary and delivers the companion `.SRT` caption file so users can test their workflow in CapCut, Premiere Pro, or DaVinci Resolve.

---

## 🔌 Connecting a Real Python / AI Backend

ClipForge AI is architected for clean backend integration. The service interface is isolated in:
`src/services/clippingService.ts`

### Recommended Backend Architecture (FastAPI + Celery + FFmpeg):

```text
[ React Frontend ] 
       │
       ▼  (1) Request Pre-signed S3 URL & Upload Video
[ S3 / Cloud Storage ]
       │
       ▼  (2) Trigger Asynchronous Job
[ FastAPI Backend ] ──► [ Redis Task Queue ] ──► [ Celery Workers ]
                                                        │
                      ┌─────────────────────────────────┴───────────────────┐
                      ▼                                                     ▼
        (3) Speech-to-Text Transcription                    (4) Highlight Detection (LLM)
        Whisper / Deepgram API (Word-level timestamps)      Gemini / Claude API (Hook scoring)
                      │                                                     │
                      └────────────────┬────────────────────────────────────┘
                                       ▼
                       (5) FFmpeg Video Rendering Worker
                       - Crop source video to 9:16 vertical
                       - Render kinetic styled subtitles via libass
                       - Export final MP4 to CDN
```

### Steps to Connect:

1. Create a `RestClippingService` class implementing `IClippingService` in `src/services/clippingService.ts`.
2. Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` in your `.env` file.
3. Implement the matching endpoints in FastAPI:
   - `POST /api/v1/jobs` — Accept upload reference & configuration.
   - `GET /api/v1/jobs/:id` — Return current stage, status, and progress (0–100%).
   - `GET /api/v1/projects/:id/clips` — Return extracted clip coordinates and subtitles.
   - `POST /api/v1/clips/:id/render` — Trigger high-bitrate MP4 burn-in and return CDN download URL.

---

## 🔒 Security & Privacy

- No third-party tracking scripts or invasive telemetry.
- Uploaded videos are never sent to external servers unless an explicit backend API URL is configured.
- No confidential credentials, API keys, or private tokens are stored in client-side code.

---

## 📄 License

Original UI/UX design and architecture created for ClipForge AI.
Open for adaptation and integration with production AI video services.
