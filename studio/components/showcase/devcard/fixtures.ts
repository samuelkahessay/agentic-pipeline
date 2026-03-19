export interface Repo {
  name: string;
  stars: number;
  language: string;
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

export interface DeveloperProfile {
  username: string;
  name: string;
  avatarUrl: string;
  bio: string;
  stats: {
    repos: number;
    followers: number;
    following: number;
  };
  topRepos: Repo[];
  languages: LanguageStat[];
}

export const FIXTURE_PROFILES: DeveloperProfile[] = [
  {
    username: "torvalds",
    name: "Linus Torvalds",
    avatarUrl: "https://avatars.githubusercontent.com/u/1024025",
    bio: "Creator of Linux and Git. Nothing more to say.",
    stats: { repos: 8, followers: 240000, following: 0 },
    topRepos: [
      { name: "linux", stars: 190000, language: "C" },
      { name: "subsurface", stars: 2400, language: "C++" },
      { name: "uemacs", stars: 1200, language: "C" },
    ],
    languages: [
      { name: "C", percentage: 72, color: "#555555" },
      { name: "C++", percentage: 14, color: "#f34b7d" },
      { name: "Assembly", percentage: 8, color: "#6E4C13" },
      { name: "Makefile", percentage: 4, color: "#427819" },
      { name: "Shell", percentage: 2, color: "#89e051" },
    ],
  },
  {
    username: "gaearon",
    name: "Dan Abramov",
    avatarUrl: "https://avatars.githubusercontent.com/u/810438",
    bio: "Working on React at Meta. Co-author of Redux and Create React App.",
    stats: { repos: 248, followers: 96000, following: 171 },
    topRepos: [
      { name: "react", stars: 226000, language: "JavaScript" },
      { name: "redux", stars: 60800, language: "TypeScript" },
      { name: "overreacted.io", stars: 7200, language: "JavaScript" },
    ],
    languages: [
      { name: "JavaScript", percentage: 58, color: "#f1e05a" },
      { name: "TypeScript", percentage: 28, color: "#3178c6" },
      { name: "CSS", percentage: 8, color: "#563d7c" },
      { name: "HTML", percentage: 4, color: "#e34c26" },
      { name: "Shell", percentage: 2, color: "#89e051" },
    ],
  },
  {
    username: "steipete",
    name: "Peter Steinberger",
    avatarUrl: "https://avatars.githubusercontent.com/u/58493",
    bio: "Founder of PSPDFKit (now Nutrient). iOS pioneer. Builder of OpenClaw — an autonomous coding agent.",
    stats: { repos: 162, followers: 18400, following: 312 },
    topRepos: [
      { name: "PSPDFKit", stars: 0, language: "Objective-C" },
      { name: "Aspects", stars: 8400, language: "Objective-C" },
      { name: "InterposeKit", stars: 820, language: "Swift" },
    ],
    languages: [
      { name: "Swift", percentage: 44, color: "#F05138" },
      { name: "Objective-C", percentage: 36, color: "#438eff" },
      { name: "Ruby", percentage: 10, color: "#701516" },
      { name: "Shell", percentage: 6, color: "#89e051" },
      { name: "Python", percentage: 4, color: "#3572A5" },
    ],
  },
  {
    username: "rauchg",
    name: "Guillermo Rauch",
    avatarUrl: "https://avatars.githubusercontent.com/u/13041",
    bio: "CEO of Vercel. Making Next.js and the web faster.",
    stats: { repos: 110, followers: 72000, following: 480 },
    topRepos: [
      { name: "next.js", stars: 124000, language: "TypeScript" },
      { name: "socket.io", stars: 60400, language: "TypeScript" },
      { name: "ms", stars: 5000, language: "TypeScript" },
    ],
    languages: [
      { name: "TypeScript", percentage: 52, color: "#3178c6" },
      { name: "JavaScript", percentage: 36, color: "#f1e05a" },
      { name: "CSS", percentage: 6, color: "#563d7c" },
      { name: "Shell", percentage: 4, color: "#89e051" },
      { name: "HTML", percentage: 2, color: "#e34c26" },
    ],
  },
  {
    username: "sindresorhus",
    name: "Sindre Sorhus",
    avatarUrl: "https://avatars.githubusercontent.com/u/170270",
    bio: "Full-time open-sourcerer. Maker of 1000+ npm packages. Unicorn obsessed.",
    stats: { repos: 1100, followers: 76000, following: 42 },
    topRepos: [
      { name: "awesome", stars: 330000, language: "Markdown" },
      { name: "ora", stars: 9200, language: "TypeScript" },
      { name: "got", stars: 14200, language: "TypeScript" },
    ],
    languages: [
      { name: "TypeScript", percentage: 48, color: "#3178c6" },
      { name: "JavaScript", percentage: 28, color: "#f1e05a" },
      { name: "Shell", percentage: 12, color: "#89e051" },
      { name: "Swift", percentage: 8, color: "#F05138" },
      { name: "Python", percentage: 4, color: "#3572A5" },
    ],
  },
  {
    username: "antirez",
    name: "Salvatore Sanfilippo",
    avatarUrl: "https://avatars.githubusercontent.com/u/65632",
    bio: "Creator of Redis. Hacker. Amateur fiction writer.",
    stats: { repos: 74, followers: 42000, following: 14 },
    topRepos: [
      { name: "redis", stars: 65000, language: "C" },
      { name: "kilo", stars: 7400, language: "C" },
      { name: "smallchat", stars: 6800, language: "C" },
    ],
    languages: [
      { name: "C", percentage: 80, color: "#555555" },
      { name: "Tcl", percentage: 10, color: "#e4cc98" },
      { name: "Shell", percentage: 5, color: "#89e051" },
      { name: "Python", percentage: 3, color: "#3572A5" },
      { name: "Makefile", percentage: 2, color: "#427819" },
    ],
  },
];

export function findProfile(username: string): DeveloperProfile | null {
  const lower = username.toLowerCase().trim();
  return FIXTURE_PROFILES.find((p) => p.username.toLowerCase() === lower) ?? null;
}
