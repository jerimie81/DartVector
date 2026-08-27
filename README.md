# DartVector - Professional Darts Scoring & Match Engine

DartVector is a professional darts scoring, match engine, and analytics platform designed to run directly in any web browser on desktop, tablet, phone, or smart TV with zero installation required.

---

## 🌐 Instant Browser Usage (No Installation Needed)

End users (family, players, league members) do not need to install or build anything:

1. **Open the App**: Simply visit the hosted application URL (e.g. your Google AI Studio live share link, Vercel URL, or custom domain) in any modern browser (**Chrome, Edge, Safari, Firefox, Opera**).
2. **Device Friendly**: Works seamlessly on **Windows, Linux, macOS, iOS (iPad/iPhone), Android tablets & phones**.
3. **Install as Web App (PWA / Chrome App)**:
   - In Chrome/Edge, click the **Install App** icon in the URL address bar (or menu $\rightarrow$ *Install DartVector*).
   - On iOS Safari, tap **Share** $\rightarrow$ **Add to Home Screen**.
   - This places a standalone DartVector icon on the desktop or home screen that launches full-screen without browser toolbars.

---

## 🚀 1-Click Cloud Deployment Guides

Deploy DartVector to the cloud in under 2 minutes so anyone can access it via a public URL:

### Option 1: Vercel (Recommended - 1-Click Free Hosting)

1. Push your repository to **GitHub** or export the project.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **"Add New Project"** and import your DartVector GitHub repository.
4. Framework Preset will automatically detect **Next.js**.
5. *(Optional)* Add environment variable `GEMINI_API_KEY` under **Environment Variables** if using AI audio announcer / AI coaching.
6. Click **Deploy**.
   - You will receive an instant, secure public link: `https://your-dartvector-app.vercel.app`.

---

### Option 2: Google Cloud Run (Containerized 1-Click)

1. In Google AI Studio Build, click **Deploy** in the top navigation bar.
2. Select your Google Cloud Project.
3. Choose **Cloud Run** and confirm deployment.
4. Your application will be live at a high-performance Google Cloud URL with global CDN.

---

### Option 3: Netlify

1. Push your code to GitHub.
2. Go to [netlify.com](https://netlify.com) and click **"Add new site" -> "Import an existing project"**.
3. Select your repository.
4. Netlify will auto-configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click **Deploy DartVector**.

---

### Option 4: Render / Railway / DigitalOcean App Platform

1. Create a **Web Service** pointing to your repository.
2. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Port**: `3000`

---

## 💻 Local Development & Testing (Linux, macOS, Windows)

Running and testing DartVector locally on your own machine is straightforward:

### Prerequisites
- **Node.js**: v18.17.0 or v20+
- **npm**: v9+ (or `pnpm` / `yarn`)

### Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open in your browser
# Navigate to http://localhost:3000
```

### Production Build Test

```bash
# Test the optimized production build locally
npm run build
npm run start
```

---

## ⚙️ Key Application Features

- **Regulation Scoring**: Standard 501, 301, Cricket, Around the Clock, Killer, and Shanghai.
- **Match Flexibility**:
  - **Singles & Free-For-All**: Up to **10 players** in a single match.
  - **Two-Team Play**: 1v1, 2v2, 3v3, 4v4, or **5v5 team battles** (up to **10 players total**) with automatic alternating turn rotation.
- **DartBot AI**: 25-level Gaussian accuracy AI simulation from beginner pub thrower to PDC World Champion.
- **Broadcast Chalkboard Mode**: Clean, high-visibility scorepad display designed for dart stands, tablets, and pub TVs.
- **Audio Announcer**: Realistic match referee voice announcements and impact sound packs (Pro Tournament, Pub Style, Heavy Steel, Electronic).
- **Match Vault & All-Time Career Analytics**: Chronological throw-by-throw replay logs and head-to-head career comparisons for up to 10 players.

---

## 📦 Optional: Standalone Desktop Packaging (.exe & .deb)

*(For advanced users who specifically want an offline Windows `.exe` installer or Linux `.deb` package)*

### Using Electron Builder

1. **Install Electron dependencies**:
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Add an `electron-main.js` file**:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   let mainWindow;

   function createWindow() {
     mainWindow = new BrowserWindow({
       width: 1400,
       height: 900,
       backgroundColor: '#09090b',
       webPreferences: { nodeIntegration: false, contextIsolation: true }
     });
     mainWindow.loadURL('http://localhost:3000');
   }

   app.whenReady().then(createWindow);
   ```

3. **Build Desktop Installers**:
   - **Windows (.exe)**: `npx electron-builder --win --x64`
   - **Linux (.deb)**: `npx electron-builder --linux deb --x64`

---

## 📄 License & Attribution
DartVector Precision Darts Scoring Engine. PDC official match scoring rules, built with Next.js and Tailwind CSS.
