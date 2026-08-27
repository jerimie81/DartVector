# DartVector - Professional Darts Scoring & Match Engine

DartVector is a professional darts scoring, match engine, and analytics platform featuring PDC-regulation rules, 25-level Gaussian DartBot AI, interactive regulation SVG dartboard, broadcast-style chalkboard mode, live match vault, and all-time career analytics.

---

## 🚀 Quick Start (Web Development)

### Prerequisites
- **Node.js**: v18.17.0 or v20+ recommended
- **npm**: v9+ (or `yarn` / `pnpm`)

### Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:3000
```

### Production Web Build

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 📦 Desktop Compilation & Packaging Guide (.exe & .deb)

You can package and compile DartVector into standalone desktop executables:
- **Windows Executable**: `.exe` installer (NSIS) or standalone portable `.exe`
- **Linux Debian Package**: `.deb` package installer for Debian, Ubuntu, Linux Mint, and derivatives

---

### Method: Electron Builder (Recommended)

DartVector can be wrapped using Electron to produce cross-platform native installers.

#### 1. Add Desktop Wrapper Dependencies

In your project root, add Electron and Electron Builder:

```bash
npm install --save-dev electron electron-builder
```

#### 2. Create Electron Main Process Entry (`electron-main.js`)

Create a file named `electron-main.js` in the project root:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'DartVector - Professional Darts Scoring Engine',
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production desktop mode, load the exported web assets or local server
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html')).catch(() => {
      mainWindow.loadURL('http://localhost:3000');
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

#### 3. Configure `package.json` for Desktop Builds

Add the `main` entry and electron-builder build scripts in `package.json`:

```json
{
  "main": "electron-main.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "desktop:pack": "electron-builder --dir",
    "dist:win": "electron-builder --win --x64",
    "dist:linux": "electron-builder --linux deb --x64",
    "dist:all": "electron-builder -wl"
  },
  "build": {
    "appId": "com.dartvector.app",
    "productName": "DartVector",
    "copyright": "Copyright © 2026 DartVector",
    "directories": {
      "output": "dist-desktop"
    },
    "files": [
      "out/**/*",
      "public/**/*",
      "electron-main.js",
      "package.json"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "DartVector"
    },
    "linux": {
      "target": [
        {
          "target": "deb",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "AppImage",
          "arch": ["x64"]
        }
      ],
      "category": "Game;Sports;",
      "icon": "public/icon.png",
      "maintainer": "DartVector Team"
    },
    "deb": {
      "priority": "optional",
      "depends": [
        "libnotify4",
        "libnss3",
        "libxss1",
        "xdg-utils",
        "libsecret-1-0"
      ]
    }
  }
}
```

---

## 🪟 Windows Executable (.exe) Compilation

### Option A: Compiling Natively on Windows

1. Open PowerShell or Command Prompt in the project folder.
2. Build the web app assets and package the `.exe`:
   ```powershell
   npm run build
   npm run dist:win
   ```
3. **Output Location**:
   The generated binaries will be placed in `dist-desktop/`:
   - `dist-desktop/DartVector Setup <version>.exe` (NSIS Installer)
   - `dist-desktop/DartVector <version>.exe` (Standalone Portable Executable)

---

### Option B: Cross-Compiling for Windows (.exe) on Linux

You can compile Windows `.exe` files directly from a Linux machine using Wine or Docker.

#### Using Wine on Linux (Ubuntu / Debian):

1. **Install Wine and 32/64-bit support**:
   ```bash
   sudo dpkg --add-architecture i386
   sudo apt-get update
   sudo apt-get install -y wine64 wine32
   ```

2. **Run the Windows build command**:
   ```bash
   npm run build
   npm run dist:win
   ```
3. The `.exe` installers will be generated in `dist-desktop/`.

#### Using Docker (Zero-dependency cross-compilation):

```bash
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_SLUG|TRAVIS_COMMIT|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST') \
  -v ${PWD}:/project \
  -v ~/.electron:/root/.electron \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run build && npm run dist:win"
```

---

## 🐧 Linux Debian Package (.deb) Compilation

### Compiling `.deb` on Linux (Debian, Ubuntu, Linux Mint)

1. **Install Linux Build Tools**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y build-essential dpkg fakeroot libarchive-tools
   ```

2. **Compile the `.deb` package**:
   ```bash
   npm run build
   npm run dist:linux
   ```

3. **Output Location**:
   The compiled Debian package is generated in `dist-desktop/`:
   - `dist-desktop/dartvector_<version>_amd64.deb` (64-bit x86)
   - `dist-desktop/dartvector_<version>_arm64.deb` (ARM64, if selected)

4. **Installing the compiled `.deb` package**:
   ```bash
   # Install via dpkg
   sudo dpkg -i dist-desktop/dartvector_*_amd64.deb

   # Fix any missing dependencies if prompted
   sudo apt-get install -f -y
   ```

5. **Launching DartVector**:
   - Run from terminal: `dartvector`
   - Or launch from your desktop application menu under **Games & Sports -> DartVector**.

6. **Uninstalling the package**:
   ```bash
   sudo apt-get remove dartvector
   ```

---

## 🛠️ Alternative: Node Single Executable Application (Node SEA / Pkg)

For command-line / headless scoring server bundles:

```bash
# Install pkg
npm install -g @yao-pkg/pkg

# Compile standalone executables for Windows (.exe) and Linux (.deb / binary)
pkg . --targets node20-win-x64,node20-linux-x64 --output-path bin/
```

---

## 📋 Summary of Build Commands

| Target Platform | Package Format | Host System | Command |
|---|---|---|---|
| **Windows** | `.exe` (NSIS Installer) | Windows | `npm run dist:win` |
| **Windows** | `.exe` (Portable) | Windows / Linux (via Wine) | `npm run dist:win` |
| **Linux** | `.deb` (Debian/Ubuntu) | Linux | `npm run dist:linux` |
| **Linux** | `.AppImage` | Linux | `npm run dist:linux` |
| **Multi-Platform** | `.exe` + `.deb` | Linux (with Wine) | `npm run dist:all` |

---

## 📄 License & Attribution
DartVector Precision Darts Scoring Engine. PDC official match scoring rules, 501/301/Cricket/Around the Clock/Killer/Shanghai game modes.
