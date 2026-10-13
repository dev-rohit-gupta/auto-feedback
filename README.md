# FeedbackGo APK download website

A static, responsive website for **FeedbackGo**, designed to be hosted by **GitHub Pages**. APK binaries are hosted by **GitHub Releases**. No Node.js or website hosting service is required.

## 1. Create a public distribution repository

Create a GitHub repository named **`feedbackgo-download`** under **`dev-rohit-gupta`**. This can be separate from your Expo app repository: only the website and published APK releases need to be public.

Copy the contents of this ZIP to the new repository root:

```text
feedbackgo-download/
├── README.md
└── docs/
    ├── .nojekyll
    ├── index.html
    ├── styles.css
    ├── main.js
    └── assets/
        ├── feedbackgo-mark.png
        ├── icon.png
        └── favicon.png
```

If you choose a different GitHub username or repository, edit only `OWNER` and `REPO` at the top of **`docs/main.js`**.

## 2. Enable GitHub Pages

1. Push the files to the repository's `main` branch.
2. Open the GitHub repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/docs`, then click **Save**.
5. Open `https://dev-rohit-gupta.github.io/feedbackgo-download/` (your URL changes if the owner/repo changes).

## 3. Create a GitHub Release

1. Build a **signed, installable release APK** from the Expo app (not an AAB and not an Expo Go/debug APK).
2. Rename the APK to **`FeedbackGo.apk`**. Keep the exact same name for all subsequent releases.
3. In the **distribution repository**, open **Releases → Draft a new release**.
4. Create a tag such as `v1.0.0`, add a clear release title and notes, then attach `FeedbackGo.apk`.
5. Publish a **normal (non-draft, non-prerelease)** release.

The site's script requests `https://api.github.com/repos/dev-rohit-gupta/feedbackgo-download/releases/latest`. It selects `FeedbackGo.apk` when present, otherwise the first `.apk` asset. The button then downloads the actual binary directly from GitHub's `browser_download_url`.

The download remains functional even if GitHub's API temporarily fails: the buttons fall back to the repository's Releases page.

**Direct link (after your first public release):**

`https://github.com/dev-rohit-gupta/feedbackgo-download/releases/latest/download/FeedbackGo.apk`

## 4. Releasing future versions

Publish a new release, e.g. `v1.0.1`, with a newly signed `FeedbackGo.apk`. The website fetches the latest full release automatically. You do **not** need to update the website or push any site code for every APK update.

**Important for updates:** Android app upgrades must use the same Android application ID and compatible signing key, and increase `versionCode`. Save your signing credentials securely; don't upload signing keys, source `.env` files, or credentials to the public distribution repository.

## 5. Testing locally

From the repository root, run:

```sh
python -m http.server 8000 --directory docs
```

Visit `http://localhost:8000`. When the public repository or release does not yet exist, the website will display a release-unavailable message instead of a misleading download button.

## Notes

- This is an **independent student app**, not an official ERP application.
- Live feedback form filling/submission has not yet been verified, so the website deliberately does not advertise it as ready.
- GitHub's latest-release API returns the most recent published, non-prerelease release (based on release/commit ordering). For normal public distribution, avoid publishing beta releases as your production latest.
- GitHub Pages sites are public. Use this repo only for the distribution site, public release notes, and APK assets.
