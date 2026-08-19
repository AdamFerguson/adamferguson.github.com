// Central site metadata. Drives navigation, social links, structured
// data (Person JSON-LD), and the RSS feed. The resume YAML is the single
// source of truth for resume content and is read separately.
export const site = {
  name: "Adam Ferguson",
  title: "Adam Ferguson — Software & Infrastructure Engineer",
  description:
    "Software and infrastructure engineer in Charlotte, NC. Full-stack web, " +
    "cloud, DevOps, and data — with a focus on simple, reliable systems.",
  // Primary custom domain. The GitHub Pages host (adamferguson.github.com)
  // is an automatic alias and is not listed here as canonical.
  url: "https://adam-ferguson.com",
  // Fallback host, useful for absolute URLs when no custom domain is set.
  host: "https://adamferguson.github.com",
  author: "Adam Ferguson",
  location: "Charlotte, NC, USA",
  // Identity / socials (kept in sync with the resume YAML profiles).
  social: {
    github: "https://github.com/AdamFerguson",
    linkedin: "https://www.linkedin.com/in/adambferg",
    stackoverflow: "https://stackoverflow.com/users/836756/adam",
  },
  email: "Adam.Brugh.Ferguson@gmail.com",
  // RSS feed location (stable URL; old /atom.xml redirects here).
  feedPath: "/feed.xml",
};

// Navigation links shown in the header.
export const nav = [
  { label: "Home", href: "/" },
  { label: "Resume", href: "/resume/" },
  { label: "Blog", href: "/blog/" },
  { label: "About", href: "/about/" },
];
