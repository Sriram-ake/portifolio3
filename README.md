# A Sri Ram · Developer Portfolio

A developer portfolio faithfully replicating the motion-rich, typography-led reference design with verified personal information, projects, technical skills, and statistics.

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
- **Verified Data:**
  - Real LeetCode problem solving metrics (419+ solved).
  - Genuine project repositories: *Masteria*, *Developer Command Center*, *Flappy Bird: Neural Flight*, *Calculator*, *DSA Suite*, etc.
  - Accurate academic trajectory at Aditya College of Engineering and Technology (B.Tech IT, CGPA 8.36).

---

## ✦ Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero introduction, skill marquee, key statistics, short bio, featured projects |
| `/projects` | Projects | 3D interactive carousel view + grid view with GitHub discovery |
| `/projects/:slug` | Project Detail | In-depth project case studies, metric cards, architecture stories, tech pills |
| `/stack` | Stack | 3D interactive skill sphere and grouped taxonomy of technologies |
| `/proof` | Proof | DSA metrics, verified certifications, achievements, education timeline |
| `/contact` | Contact | Direct email link, social profiles, and interactive note dispatch form |

---

## ✦ Running Locally

To preview the portfolio locally with full single-page application routing support:

```bash
# Using Python
python serve.py 5173

# Or with npm
npm start
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✦ Deployment

The portfolio is static and production-ready for deployment on **Vercel**, **Netlify**, **Render**, or **GitHub Pages**.

A `vercel.json` rewrite configuration is included out of the box for client-side routing.
"# portifolio3" 
