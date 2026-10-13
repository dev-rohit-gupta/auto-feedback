# FeedbackGo APK download website

A static, responsive website for **FeedbackGo**, designed to be hosted by **GitHub Pages**. APK binaries are hosted by **GitHub Releases**. No Node.js or website hosting service is required.

## 1. Use your existing public distribution repository

Use the existing public repository **`dev-rohit-gupta/auto-feedback`**. Keep the website in its `docs/` folder, and publish the APK releases in this **same repository**. There is no need to create a new repository.

Place the included files in your existing `auto-feedback` repository root (merge rather than deleting existing files):

```text
auto-feedback/
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

The release lookup and website links are already configured for `dev-rohit-gupta/auto-feedback`. If you rename the repository in the future, update both `docs/main.js` and the fallback links in `docs/index.html`.

## 2. Enable GitHub Pages

1. Push the files to the repository's `main` branch.
2. Open the GitHub repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/docs`, then click **Save**.
5. Open `https://dev-rohit-gupta.github.io/auto-feedback/` (your URL changes if the owner/repo changes).

## 3. Create a GitHub Release

1. Build a **signed, installable release APK** from the Expo app (not an AAB and not an Expo Go/debug APK).
2. Rename the APK to **`FeedbackGo.apk`**. Keep the exact same name for all subsequent releases.
3. In the **distribution repository**, open **Releases → Draft a new release**.
4. Create a tag such as `v1.0.0`, add a clear release title and notes, then attach `FeedbackGo.apk`.
5. Publish a **normal (non-draft, non-prerelease)** release.

The site's script requests `https://api.github.com/repos/dev-rohit-gupta/auto-feedback/releases/latest`. It selects `FeedbackGo.apk` when present, otherwise the first `.apk` asset. The button then downloads the actual binary directly from GitHub's `browser_download_url`.

If the API fails, the buttons fall back to the repository's Releases page. That page may itself lack APKs until a release is actually published.

**Direct link (after your first public release):**

`https://github.com/dev-rohit-gupta/auto-feedback/releases/latest/download/FeedbackGo.apk`

## 4. Releasing future versions

Publish a new release, e.g. `v1.0.1`, with a newly signed `FeedbackGo.apk`. The website fetches the latest full release automatically. You do **not** need to update the website or push any site code for every APK update.

**Important for updates:** Android app upgrades must use the same Android application ID and compatible signing key, and increase `versionCode`. Save your signing credentials securely; don't upload signing keys, source `.env` files, or credentials to the public distribution repository.

## 5. Updating the already-live GitHub Pages site

Commit and push `docs/index.html`, `docs/main.js`, the `README.md`, and `tests/site.test.cjs` to the existing repository. GitHub Pages must be configured to deploy from the branch containing `docs/`. After deployment, hard-refresh the page with `Ctrl+Shift+R` or open an incognito window to bypass cached JavaScript.

**Important:** A published release with only source archives is not enough; attach a signed, installable `.apk` as a release asset. Until then, the site intentionally shows **View GitHub releases**.

## 6. Testing locally

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
