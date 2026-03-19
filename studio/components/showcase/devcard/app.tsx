"use client";

import { useState, useRef, useCallback, FormEvent } from "react";
import { FIXTURE_PROFILES, findProfile, type DeveloperProfile } from "./fixtures";
import { THEMES, DEFAULT_THEME, type Theme } from "./themes";
import styles from "./app.module.css";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── DevCard ────────────────────────────────────────────────────────────────

function DevCard({
  profile,
  theme,
  size = "full",
}: {
  profile: DeveloperProfile;
  theme: Theme;
  size?: "full" | "mini";
}) {
  const cardStyle = {
    "--card-bg": theme.cardBg,
    "--card-border": theme.cardBorder,
    "--card-fg": theme.foreground,
    "--card-accent": theme.accent,
    "--card-muted": theme.mutedText,
    "--card-stat-label": theme.statLabel,
    "--card-repo-bg": theme.repoBg,
  } as React.CSSProperties;

  if (size === "mini") {
    return (
      <div className={styles.miniCard} style={cardStyle}>
        <img
          className={styles.miniAvatar}
          src={profile.avatarUrl}
          alt={profile.name}
          width={36}
          height={36}
        />
        <div className={styles.miniInfo}>
          <span className={styles.miniName}>{profile.name}</span>
          <span className={styles.miniUsername}>@{profile.username}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.devCard} style={cardStyle}>
      {/* Profile section */}
      <div className={styles.cardProfile}>
        <img
          className={styles.avatar}
          src={profile.avatarUrl}
          alt={profile.name}
          width={64}
          height={64}
        />
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{profile.name}</h2>
          <span className={styles.profileUsername}>@{profile.username}</span>
          {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{formatNumber(profile.stats.repos)}</span>
          <span className={styles.statLabel}>Repos</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{formatNumber(profile.stats.followers)}</span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{formatNumber(profile.stats.following)}</span>
          <span className={styles.statLabel}>Following</span>
        </div>
      </div>

      {/* Language breakdown */}
      <div className={styles.languageSection}>
        <div className={styles.langBar}>
          {profile.languages.map((lang) => (
            <div
              key={lang.name}
              className={styles.langSegment}
              style={{ width: `${lang.percentage}%`, background: lang.color }}
              title={`${lang.name}: ${lang.percentage}%`}
            />
          ))}
        </div>
        <div className={styles.langLegend}>
          {profile.languages.map((lang) => (
            <span key={lang.name} className={styles.langLegendItem}>
              <span
                className={styles.langDot}
                style={{ background: lang.color }}
              />
              {lang.name}
              <span className={styles.langPct}>{lang.percentage}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Top repos */}
      <div className={styles.reposSection}>
        <h3 className={styles.reposTitle}>Top repositories</h3>
        <div className={styles.repoList}>
          {profile.topRepos.map((repo) => (
            <div key={repo.name} className={styles.repoItem}>
              <div className={styles.repoInfo}>
                <span className={styles.repoName}>{repo.name}</span>
                {repo.description && (
                  <span className={styles.repoDesc}>{repo.description}</span>
                )}
              </div>
              <div className={styles.repoMeta}>
                <span className={styles.repoLang}>{repo.language}</span>
                {repo.stars > 0 && (
                  <span className={styles.repoStars}>
                    ★ {formatNumber(repo.stars)}
                  </span>
                )}
                {repo.forks != null && repo.forks > 0 && (
                  <span className={styles.repoForks}>
                    ⑂ {formatNumber(repo.forks)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PNG export (canvas-based, no external dependencies) ──────────────────

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function exportCardAsPng(profile: DeveloperProfile, theme: Theme) {
  const scale = 2;
  const w = 380;
  const h = 420;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Card background
  drawRoundRect(ctx, 0, 0, w, h, 12);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar circle placeholder
  ctx.beginPath();
  ctx.arc(52, 52, 32, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  // Initials in avatar
  ctx.fillStyle = theme.cardBg;
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  ctx.fillText(initials, 52, 52);

  // Name
  ctx.textAlign = "left";
  ctx.fillStyle = theme.foreground;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillText(profile.name, 96, 36);

  // Username
  ctx.fillStyle = theme.mutedText;
  ctx.font = "13px monospace";
  ctx.fillText(`@${profile.username}`, 96, 56);

  // Bio
  if (profile.bio) {
    ctx.fillStyle = theme.mutedText;
    ctx.font = "12px system-ui, sans-serif";
    const bio = profile.bio.length > 60 ? profile.bio.slice(0, 57) + "..." : profile.bio;
    ctx.fillText(bio, 96, 74);
  }

  // Separator
  ctx.strokeStyle = theme.cardBorder;
  ctx.beginPath();
  ctx.moveTo(20, 96);
  ctx.lineTo(w - 20, 96);
  ctx.stroke();

  // Stats
  const stats = [
    { label: "REPOS", val: formatNumber(profile.stats.repos) },
    { label: "FOLLOWERS", val: formatNumber(profile.stats.followers) },
    { label: "FOLLOWING", val: formatNumber(profile.stats.following) },
  ];
  const statWidth = (w - 40) / 3;
  stats.forEach((s, i) => {
    const cx = 20 + statWidth * i + statWidth / 2;
    ctx.fillStyle = theme.foreground;
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.val, cx, 122);
    ctx.fillStyle = theme.statLabel;
    ctx.font = "500 9px system-ui, sans-serif";
    ctx.fillText(s.label, cx, 138);
  });

  // Language bar
  let lx = 20;
  const barW = w - 40;
  const barY = 156;
  profile.languages.forEach((lang) => {
    const segW = (lang.percentage / 100) * barW;
    drawRoundRect(ctx, lx, barY, segW - 1, 6, 3);
    ctx.fillStyle = lang.color;
    ctx.fill();
    lx += segW;
  });

  // Language legend
  ctx.textAlign = "left";
  let ly = 176;
  let legendX = 20;
  profile.languages.forEach((lang) => {
    ctx.beginPath();
    ctx.arc(legendX + 4, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = lang.color;
    ctx.fill();
    ctx.fillStyle = theme.mutedText;
    ctx.font = "11px system-ui, sans-serif";
    const text = `${lang.name} ${lang.percentage}%`;
    ctx.fillText(text, legendX + 12, ly + 4);
    legendX += ctx.measureText(text).width + 22;
    if (legendX > w - 60) {
      legendX = 20;
      ly += 18;
    }
  });

  // Repos section
  let ry = ly + 28;
  ctx.fillStyle = theme.statLabel;
  ctx.font = "600 9px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TOP REPOSITORIES", 20, ry);
  ry += 16;

  profile.topRepos.forEach((repo) => {
    drawRoundRect(ctx, 20, ry, w - 40, 28, 4);
    ctx.fillStyle = theme.repoBg;
    ctx.fill();
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.font = "500 12px monospace";
    ctx.fillText(repo.name, 30, ry + 17);
    if (repo.stars > 0) {
      ctx.fillStyle = theme.mutedText;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`★ ${formatNumber(repo.stars)}`, w - 30, ry + 17);
      ctx.textAlign = "left";
    }
    ry += 36;
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.username}-devcard.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState("");
  const [activeProfile, setActiveProfile] = useState<DeveloperProfile | null>(
    FIXTURE_PROFILES[0]
  );
  const [notFound, setNotFound] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(DEFAULT_THEME);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, []);

  const handleExportPng = useCallback(() => {
    if (activeProfile) {
      exportCardAsPng(activeProfile, selectedTheme);
    }
  }, [activeProfile, selectedTheme]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const match = findProfile(trimmed);
    if (match) {
      setActiveProfile(match);
      setNotFound(false);
    } else {
      setActiveProfile(null);
      setNotFound(true);
    }
  }

  function handleGalleryClick(profile: DeveloperProfile) {
    setActiveProfile(profile);
    setNotFound(false);
    setInput(profile.username);
  }

  return (
    <div className={styles.shell}>
      {/* Left panel: input + card + theme selector */}
      <div className={styles.mainPanel}>
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <input
            className={styles.usernameInput}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a GitHub username…"
            aria-label="GitHub username"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className={styles.generateBtn}>
            Generate
          </button>
        </form>

        <div className={styles.cardArea}>
          {notFound ? (
            <div className={styles.notFound}>
              <span className={styles.notFoundIcon}>?</span>
              <p className={styles.notFoundText}>
                Profile not available for <strong>{input}</strong>
              </p>
              <p className={styles.notFoundHint}>
                Try: torvalds, gaearon, steipete, rauchg, sindresorhus, antirez, addyosmani, kentcdodds, sdras
              </p>
            </div>
          ) : activeProfile ? (
            <DevCard profile={activeProfile} theme={selectedTheme} />
          ) : null}
        </div>

        {/* Export actions */}
        {activeProfile && (
          <div className={styles.exportActions}>
            <button className={styles.exportBtn} onClick={handleExportPng}>
              Export PNG
            </button>
            <button className={styles.copyLinkBtn} onClick={handleCopyLink}>
              {linkCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        )}

        {/* Theme selector */}
        <div className={styles.themeSelector} role="group" aria-label="Card theme">
          <span className={styles.themeLabel}>Theme</span>
          <div className={styles.themeSwatches}>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`${styles.swatch} ${selectedTheme.id === theme.id ? styles.swatchActive : ""}`}
                style={{ background: theme.background, borderColor: theme.accent }}
                onClick={() => setSelectedTheme(theme)}
                title={theme.name}
                aria-label={theme.name}
                aria-pressed={selectedTheme.id === theme.id}
              >
                <span
                  className={styles.swatchAccent}
                  style={{ background: theme.accent }}
                />
              </button>
            ))}
          </div>
          <span className={styles.themeNameLabel}>{selectedTheme.name}</span>
        </div>
      </div>

      {/* Right panel: gallery */}
      <div className={styles.galleryPanel}>
        <h3 className={styles.galleryTitle}>Notable developers</h3>
        <div className={styles.gallery}>
          {FIXTURE_PROFILES.map((profile) => (
            <button
              key={profile.username}
              className={`${styles.galleryItem} ${activeProfile?.username === profile.username ? styles.galleryItemActive : ""}`}
              onClick={() => handleGalleryClick(profile)}
              aria-pressed={activeProfile?.username === profile.username}
            >
              <DevCard
                profile={profile}
                theme={selectedTheme}
                size="mini"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
