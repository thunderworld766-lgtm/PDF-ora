# PDFora — Everything Your PDF Needs

> **PDFora** is a premium, modern, professional, and scalable online PDF workstation built for zero-latency, privacy-first document operations directly in the browser.

---

## 🌟 Tagline
**"Everything Your PDF Needs."**

---

## 🚀 Key Features Built & Implemented

### 1. 🎨 Modern SaaS Landing Page
- High-impact hero section with live drag-and-drop file ingestion zone.
- Instant **"Load Interactive Sample PDF"** button (test real vector operations without needing to find a file).
- 12+ feature tools showcase cards with glowing interactive hover states.
- Client-side privacy & sub-second WebAssembly highlights.
- Comparison matrix against legacy tools (Acrobat, Smallpdf, iLovePDF).
- Cloud Roadmap preview highlighting **Supabase & Cloudflare R2** integration readiness.

### 2. 🔐 Authentication & Session Flow
- Modal-driven authentication interface with **Sign In**, **Sign Up**, and **Password Recovery**.
- **Social Login fast-connect** buttons (Google & GitHub).
- **Guest Explorer Mode** allowing instant one-click access without signup.
- User profile switching (Pro, Free, Enterprise tiers) and quota meters.

### 3. 📊 Productivity Dashboard
- Comprehensive metrics: Active documents, processed pages, storage quota visual meters.
- Quick Tool Launchers (Merge, Split, Sign, Compress, Watermark).
- Recent Documents list with real-time star toggles, download, and delete actions.
- Local client storage persistence with zero external data leaks.

### 4. 🛠️ Interactive PDF Editor Workspace
- **High-DPI Canvas Rendering**: Powered by `pdfjs-dist` on HTML5 canvas for crisp vector document fidelity.
- **Left Thumbnail Strip**: Displays page previews, rotation indicators, and one-click page navigation.
- **Zoom & View Controls**: Zoom in/out (60% to 250%), 100% reset, Fit to width.
- **Multi-page Navigation**: Prev/Next buttons, jump to page, total page indicators.
- **Rotation Controls**: Interactive 90° clockwise rotations per page or in batch.
- **Vector Annotations & Stamping**:
  - **Text Annotations**: Click anywhere on the document canvas to place custom notes with double-click deletion.
  - **Digital Stamps**: APPROVED, CONFIDENTIAL, VOID, REVIEWED stamps with angled borders.
  - **Vector Signature Pad**: Draw with stylus/mouse or type stylized script font names.
  - **Watermark Engine**: Apply diagonal watermark stamps with custom opacity, font size, and rotation.
- **Export & Download**: Permanently burns annotations, signatures, and page rotations into a brand-new compliant PDF using `pdf-lib`.

### 5. 🧰 Dedicated PDF Tools Suite
- **Merge PDF**: Combine multiple PDFs into a single file with sample test loaders.
- **Split PDF**: Extract specific page ranges (e.g., `1-2` or `1,3`).
- **Compress PDF**: Optimize file streams with quality profiles (Basic, Recommended, Extreme).
- **Rotate Pages**: Batch rotate all pages by 90°, 180°, or 270°.
- **Protect & Encrypt**: Password protection and digital verification layer.
- **Watermark & Brand**: Custom diagonal text watermark generator.
- **Images to PDF**: Compile PNG and JPEG images into a multi-page PDF publication.

### 6. 📁 My Documents / Document Vault
- Search documents by name or tags.
- Filter by All or Starred documents.
- Grid View and List View layouts.
- Direct import from desktop and one-click launch in the editor workspace.

### 7. ⚙️ Settings & Future Cloud Integrations
- **Cloudflare R2 Object Storage Panel**: Bucket name, Account ID, Access Key ID, Secret Key configuration with test ping.
- **Supabase Panel**: Project URL and Anon Public Key configuration with connection test.
- **Display Themes**: Midnight Dark (default) and Daylight Light modes.
- **PDF Render Quality**: Selectable 150 DPI, 300 DPI, or 600 DPI rendering modes.

---

## 💻 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | High-performance interactive UI components |
| **TypeScript** | Type-safe enterprise architecture |
| **Tailwind CSS** | Premium dark-mode SaaS styling and glassmorphism |
| **Framer Motion** | Smooth micro-animations and transitions |
| **PDF.js (`pdfjs-dist`)** | Canvas page rasterization and thumbnail generation |
| **`pdf-lib`** | Pure JavaScript client-side PDF synthesis, merging, splitting, stamping, and exporting |
| **Lucide React** | Modern iconography |
| **Canvas Confetti** | Delightful feedback on export actions |
| **Future Backend** | Pre-architected interfaces for **Supabase** (Postgres + RLS) & **Cloudflare R2** (Zero-egress storage) |

---

## 🏃‍♂️ How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

© 2026 **PDFora** — *Everything Your PDF Needs.*
