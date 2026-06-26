# DepXray — Ghost-Dependency Auditor for Bundle Optimization

> **"You installed Moment.js for one `format()` call. You're shipping 67KB you'll never use."**

In 2024, the average web application ships **2.3MB of JavaScript** — roughly 40% of which is never executed. Developers reach for popular libraries like Lodash, Moment.js, or Axios because they solve problems fast. But most projects use less than 5% of what they import. Bundle bloat is invisible until it isn't: slow LCP, failed audits, angry users on 3G. DepXray puts the waste in plain sight.

**Live Demo → [https://ghost-ai-nu.vercel.app](https://ghost-ai-nu.vercel.app)**

Privacy-First Scanning • Zero Cloud Storage • Real-Time Utility Analysis • Sub-Second Audits

React • Vite • TypeScript • GitHub API • Offline-Ready

---

## 📚 Table of Contents

- [Overview](#overview)
- [What Makes It Different](#what-makes-it-different)
- [Core Experience](#core-experience)
- [The Utility Ratio](#the-utility-ratio)
- [Folder Structure](#folder-structure)
- [Technical Pipeline](#technical-pipeline)
- [Tech Stack](#tech-stack)
- [Running Locally](#running-locally)
- [Why DepXray?](#why-depxray)

---

## ✚ Overview

DepXray is a ghost-dependency auditor engineered for modern JavaScript projects.

It scans any public GitHub repository, cross-references `package.json` against actual source code usage, and calculates a **Utility Ratio** for every dependency — the ratio of what a library *could* give you versus what your code actually *uses*.

A 68% waste score on Moment.js is not a warning. It's a diagnosis.

DepXray transforms an invisible, systemic problem into a dashboard your whole team can act on — with one-click swap suggestions, visual tree maps, and before/after bundle deltas.

No installs. No accounts. No backend. Paste a repo URL and X-Ray it.

---

## ✨ What Makes It Different

| Traditional Bundle Analyzers | DepXray |
|---|---|
| Requires local build setup | Scan any public repo instantly |
| Shows raw sizes only | Shows **Utility Ratio** (waste %) |
| Static output | Live GitHub scanning via API |
| No actionable recommendations | One-click lightweight swap suggestions |
| Dev-only tooling | Sharable audit results |
| No cross-repo comparison | Hall of Shame leaderboard |

This is not a build plugin. It is a live, zero-friction dependency intelligence layer.

---

## 🎨 Core Experience

**Instant Repo Scan:** Paste any `owner/repo` or GitHub URL. DepXray fetches `package.json`, traverses the source tree, and maps every `import` statement across the entire codebase.

**Utility Ratio Engine:** For each dependency, DepXray calculates `(Total Library Size) / (Functions Actually Imported)`. A ratio below 10% triggers a red flag. A library with zero actual usage is a ghost.

**Tree Map Visualization:** Each dependency renders as a weighted square. Size = library weight. Color = waste level. A giant red square is Moment.js with one `format()` call. A clean green square is a dependency earning its bytes.

**Lightweight Swap Suggestions:** DepXray matches your ghost dependencies against a curated swap registry. Using 2% of Lodash? It suggests `lodash-es` tree-shaking or native equivalents. Using Moment.js for formatting? It auto-generates a refactor path to `date-fns` or native `Intl`.

**Hall of Shame:** Five pre-audited famous repos — `create-react-app`, `vue-cli`, `nestjs`, `storybook`, and `vite` — displayed on the landing page. Click any card to run a live scan against the current state of that repo.

**GitHub Token Support:** Add your personal token to bypass rate limits and unlock faster, deeper scanning.

---

## ⚡ The Utility Ratio

The Utility Ratio is DepXray's core metric. It answers the question: *how much of what you're shipping are you actually using?*

```
Utility Ratio = (Functions Imported from Library) / (Total Exported Functions in Library)
Waste Score   = 100% - Utility Ratio
```

**Grade thresholds:**

| Grade | Waste Score | Meaning |
|---|---|---|
| A | 0–10% | Clean. Library is well-utilized. |
| B | 11–30% | Minor waste. Acceptable. |
| C | 31–40% | Moderate ghost. Review imports. |
| D | 41–70% | Heavy ghost. Swap recommended. |
| F | 71–100% | Full ghost. This library is a liability. |

The Hall of Shame tracks the worst offenders across famous public repos, updated on every scan.

---

## 📁 Folder Structure

```
depxray/
├─ README.md
│
├─ src/
│  ├─ components/
│  │  ├─ HallOfShame.tsx       # Pre-audited repo leaderboard
│  │  ├─ SwapPanel.tsx         # Lightweight replacement engine
│  │  ├─ TreeMap.tsx           # Visual waste visualization
│  │  └─ Scanner.tsx           # Core repo scanning interface
│  │
│  ├─ engine/
│  │  ├─ github.ts             # GitHub API traversal & rate handling
│  │  ├─ parser.ts             # Import extraction across file types
│  │  ├─ scorer.ts             # Utility Ratio computation
│  │  └─ swaps.ts              # Swap registry & refactor suggestions
│  │
│  ├─ hooks/
│  │  └─ useScanner.ts         # Scanning state & async orchestration
│  │
│  ├─ services/
│  │  └─ registry.ts           # Dependency size & export registry
│  │
│  ├─ App.tsx
│  ├─ App.css
│  ├─ main.tsx
│  └─ types.ts                 # Strict dependency audit schemas
│
└─ public/
   └─ index.html
```

---

## 🔁 Technical Pipeline

### 🔍 Scan Lifecycle

1. **Input:** User pastes a GitHub repo URL or `owner/repo` slug.
2. **Fetch:** `github.ts` retrieves `package.json` via GitHub Contents API, extracting `dependencies` and `devDependencies`.
3. **Traverse:** All `.ts`, `.tsx`, `.js`, and `.jsx` files in `src/` are fetched and decoded.
4. **Parse:** `parser.ts` extracts every `import` statement across the entire codebase via AST-aware regex.
5. **Score:** `scorer.ts` computes the Utility Ratio per dependency against the local size + export registry.
6. **Visualize:** Results are rendered as a color-graded Tree Map with per-library drill-down.
7. **Recommend:** `swaps.ts` matches F/D-grade libraries against the swap registry and generates migration suggestions.

### 🔒 Privacy Model

All scanning happens in the browser. No repo data is sent to any server. The GitHub API is called directly from the client. DepXray has no backend, no database, and no analytics on your code.

---

## 🧪 Tech Stack

**Frontend**

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Visualization | Recharts + Custom SVG Tree Map |
| Icons | Lucide React |

**Scanning Engine**

| Layer | Technology |
|---|---|
| Repo Access | GitHub REST API v3 |
| Import Parsing | AST-aware regex engine (client-side) |
| Size Registry | Curated static registry (bundlephobia-inspired) |
| Rate Limiting | Personal token support + exponential backoff |

**Infrastructure**

| Layer | Technology |
|---|---|
| Hosting | Vercel (Static) |
| Build | Vite SSG |
| CI | Vercel Git Integration |

---

## ▶ Running Locally

**Installation**

```bash
git clone https://github.com/Iniyan-06/devxray.git
cd devxray
npm install
```

**Development**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start auditing.

**Environment Variables (optional)**

Create a `.env.local` file to unlock higher GitHub API rate limits:

```bash
VITE_API_URL=https://devxray.onrender.com
VITE_GITHUB_TOKEN=your_github_token_here
```

Without a token, the GitHub API allows 60 unauthenticated requests/hour — enough for quick scans. With a token, this increases to 5,000/hour.

**Production Build**

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```

---

## 💭 Why DepXray?

> *"Standard bundle analyzers show you the crime scene. DepXray names the criminal."*

Every JavaScript project accumulates ghost dependencies. It happens slowly: a deadline here, a convenient package there. Nobody audits what they already shipped.

DepXray is built on a simple premise:

- **Visibility is the first fix.** You can't remove what you can't see.
- **The metric has to be actionable.** Raw KB numbers don't tell you what to do. Utility Ratio does.
- **Friction is the enemy.** No installs, no build steps, no accounts. Paste and go.

It is not about blaming developers for choosing Lodash. It is about making the cost of that choice visible — and the path to fixing it effortless.

> *"Your bundle size is a reflection of every decision you didn't notice you were making. DepXray makes you notice."*

---

**Live Demo → [https://ghost-ai-nu.vercel.app](https://ghost-ai-nu.vercel.app)**
add this read me file and commit changes in git
