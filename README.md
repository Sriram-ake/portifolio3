# A Sri Ram · Developer Portfolio

A developer portfolio faithfully replicating the motion-rich, typography-led reference design with verified personal details, projects, technical skills, and a **direct Brevo transactional email integration** running as Vercel serverless functions.

---

## ✦ Highlights

- **Hero & Identity:**
  - Dynamic kinetic typography with letter scrambling and entrance animations.
  - Interactive rotating slot words (`scale`, `solve`, `hold up`).
  - Brand mark `s · r` in the header with full accessible mobile drawer navigation.
  - Reactive magnetic CTA buttons with cursor snapping.
- **3D WebGL Motion (Three.js):**
  - **Hero Stage:** Ambient interactive particle field reacting to mouse and scroll.
  - **Projects Carousel:** 3D cylindrical project card carousel with drag, swipe, wheel, and keyboard arrow controls.
  - **Stack Sphere:** Interactive 3D tag sphere that pauses on hover and highlights skills across categories.
  - **Receipts & Proof:** 3D orbit stage visualising academic and problem-solving trajectory.
  - **Contact Sky:** Interactive 3D folded paper airplane animation that launches upon note submission.
- **Micro-Interactions & Transitions:**
  - Custom fluid spring cursor with magnetic snapping, hover states, and dynamic label tooltips.
  - 3D card perspective tilting with dynamic specular mouse glare.
  - Infinite scroll-velocity-adaptive marquee of core skills.
  - Animated live counters with `expo.out` easing for statistics.
- **Direct Brevo Email Integration (Serverless):**
  - Sends messages directly to `akesurekha@gmail.com` via the official Brevo Transactional Email API.
  - Zero reliance on `mailto:`, Gmail, or external email clients.
  - Runs entirely as a Node.js serverless API function on Vercel (`api/contact.js`).
  - Strict input validation, in-memory rate limiting, and bot honeypot protection.
  - In-flight `"Sending..."` state, success confirmation, and error alerts without wiping user input on failure.
- **Verified Data:**
  - Real LeetCode problem solving metrics (419+ solved).
  - Genuine project repositories: *Masteria*, *Developer Command Center*, *Flappy Bird: Neural Flight*, *Calculator*, *DSA Suite*, etc.
  - Accurate academic trajectory at Aditya College of Engineering and Technology (B.Tech IT, CGPA 8.36).

---

## ✦ Project Structure

```
portifolio3/
├── api/
│   ├── contact.js          # Vercel serverless function: POST /api/contact (Brevo)
│   ├── stats.js            # Vercel serverless function: GET /api/stats
│   └── contact/
│       └── status.js       # Vercel serverless function: GET /api/contact/status
├── assets/                 # Frontend JS chunks, CSS, WOFF2 variable fonts
├── favicon.svg             # Theme-aligned brand icon
├── index.html              # HTML entry point with metadata & base href
├── og.png                  # Open Graph preview card
├── package.json            # Node scripts and project configuration
├── resume.pdf              # Verified PDF resume
├── server.js               # Local development Node.js server
├── serve.py                # Optional local Python preview server
├── vercel.json             # Vercel routing, rewrites, and caching headers
├── .env.example            # Environment variables template
└── .gitignore              # Protects secrets and build artifacts
```

---

## ✦ Deploying to Vercel (Direct from GitHub)

This repository is pre-configured for complete deployment on **Vercel** with no separate backend required:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless functions and routing"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository: **`Sriram-ake/portifolio3`**.
4. In **Project Settings > Environment Variables**, add the following:

   | Variable | Value | Description |
   |---|---|---|
   | `BREVO_API_KEY` | `xkeysib-...` | Your Brevo API v3 key from [Brevo Settings](https://app.brevo.com/settings/keys/api) |
   | `BREVO_SENDER_EMAIL` | `your_verified_email@domain.com` | Your verified sender email address in Brevo |
   | `BREVO_SENDER_NAME` | `A Sri Ram Portfolio Contact Form` | Sender display name |
   | `CONTACT_RECEIVER_EMAIL`| `akesurekha@gmail.com` | Destination inbox for contact inquiries |

5. Click **"Deploy"**. Vercel will build the project and serve both:
   - The static frontend across its global Edge Network.
   - The `/api/contact` and `/api/stats` serverless functions on demand.

---

## ✦ Local Development

To run the project locally:

### Option 1: Node.js (Recommended)
```bash
npm start
# or: node server.js
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 2: Python
```bash
python serve.py 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

For local email testing, create a `.env` file from `.env.example` and populate your Brevo credentials.
