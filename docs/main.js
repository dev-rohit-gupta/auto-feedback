"use strict";

// Publish website + GitHub Releases in this public repository.
// If you choose a different repository, change OWNER and REPO only.
const OWNER = "dev-rohit-gupta";
const REPO = "auto-feedback";

const repository = `https://github.com/${OWNER}/${REPO}`;
const releasesPage = `${repository}/releases`;
const latestApi = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

const ui = {
  primary: document.getElementById("primary-download"),
  primaryText: document.getElementById("primary-download-text"),
  release: document.getElementById("release-download"),
  mini: document.getElementById("release-mini"),
  version: document.getElementById("release-version"),
  size: document.getElementById("release-size"),
  date: document.getElementById("release-date"),
  status: document.getElementById("release-status"),
};

// Keep every button functional even before the first release exists.
for (const id of ["header-release", "install-release-link", "release-history"]) {
  const element = document.getElementById(id);
  if (element) element.href = releasesPage;
}
const footer = document.getElementById("footer-github");
if (footer) footer.href = repository;
ui.primary.href = releasesPage;
ui.release.href = releasesPage;

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Android APK";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB APK`;
}

function formatDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.valueOf())) return "GitHub Releases";
  return `Published ${new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date)}`;
}

function showRelease(release) {
  if (!release || !Array.isArray(release.assets)) throw new Error("Unexpected release data");
  const assets = release.assets.filter((asset) =>
    typeof asset.name === "string" && asset.name.toLowerCase().endsWith(".apk") &&
    typeof asset.browser_download_url === "string" &&
    asset.browser_download_url.startsWith(`${repository}/releases/download/`)
  );
  const apk = assets.find((asset) => asset.name.toLowerCase() === "feedbackgo.apk") || assets[0];

  ui.version.textContent = `Version: ${release.tag_name || "Latest"}`;
  ui.date.textContent = formatDate(release.published_at);

  if (!apk) {
    ui.mini.textContent = "A release is published, but no Android APK is attached yet.";
    ui.status.textContent = "Visit the release page to view available files.";
    return;
  }

  ui.primary.href = apk.browser_download_url;
  ui.release.href = apk.browser_download_url;
  ui.primaryText.textContent = "Download APK";
  ui.release.textContent = "Download APK ↓";
  ui.size.textContent = formatSize(apk.size);
  ui.mini.textContent = `${release.tag_name || "Latest release"} · ${formatSize(apk.size)} · Hosted on GitHub`;
  ui.status.textContent = "Official project release file, delivered by GitHub.";
}

async function loadLatestRelease() {
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(latestApi, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (response.status === 404) {
      ui.mini.textContent = "No public release yet — check back soon.";
      ui.version.textContent = "First release coming soon";
      ui.status.textContent = "Publish an APK under GitHub Releases to activate downloads automatically.";
      return;
    }
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    showRelease(await response.json());
  } catch {
    ui.mini.textContent = "Version info unavailable. You can still browse GitHub Releases.";
    ui.version.textContent = "Browse release history";
    ui.status.textContent = "Couldn't check for the latest APK. Use the GitHub Releases link.";
  } finally {
    clearTimeout(abort);
  }
}

loadLatestRelease();
