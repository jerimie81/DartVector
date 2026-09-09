const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let nextServerProcess = null;
let nextServerPort = null;

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch (error) {
      // Server is still starting, retry.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for the Next.js server to become ready at ${url}`);
}

function startNextServer(port) {
  const nextCliPath = require.resolve('next/dist/bin/next');

  nextServerProcess = spawn(
    process.execPath,
    [nextCliPath, 'start', '-p', String(port), '-H', '127.0.0.1'],
    {
      cwd: app.getAppPath(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: '127.0.0.1',
      },
      stdio: 'inherit',
    }
  );

  nextServerProcess.on('error', (error) => {
    console.error('Failed to start the bundled Next.js server:', error);
  });
}

async function launchApp() {
  nextServerPort = await findAvailablePort();
  startNextServer(nextServerPort);

  const url = `http://127.0.0.1:${nextServerPort}`;
  await waitForServer(url);

  if (mainWindow) {
    await mainWindow.loadURL(url);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'DartVector',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  launchApp().catch((error) => {
    console.error('Unable to launch DartVector:', error);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (nextServerProcess && !nextServerProcess.killed) {
    nextServerProcess.kill('SIGTERM');
  }
});
