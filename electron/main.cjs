const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { createServer } = require('node:net');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');

let backendProcess = null;
const SELECT_DIRECTORY_CHANNEL = 'adj:select-directory';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRuntimeRoot() {
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, 'app');
}

function getBackendExecutable(runtimeRoot) {
  const binaryName = process.platform === 'win32' ? 'backend.exe' : 'backend';
  return path.join(runtimeRoot, 'backend', binaryName);
}

function getBackendPortFilePath() {
  return path.join(app.getPath('userData'), '.adj-valet-port');
}

function waitForHealth(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const tryRequest = () => {
      const request = http.get(`${baseUrl}/health`, (response) => {
        response.resume();

        if (response.statusCode === 200) {
          resolve();
          return;
        }

        if (Date.now() >= deadline) {
          reject(new Error(`Backend health check failed with status ${response.statusCode}`));
          return;
        }

        setTimeout(tryRequest, 250);
      });

      request.on('error', () => {
        if (Date.now() >= deadline) {
          reject(new Error('Timed out waiting for backend health check'));
          return;
        }

        setTimeout(tryRequest, 250);
      });
    };

    tryRequest();
  });
}

async function readBackendUrl(portFilePath, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const portInfo = JSON.parse(await fs.readFile(portFilePath, 'utf8'));

      if (portInfo.backend_url) {
        await waitForHealth(portInfo.backend_url, 5000);
        return portInfo.backend_url;
      }
    } catch {
      // The backend has not written the port file yet.
    }

    await delay(250);
  }

  throw new Error('Timed out waiting for the backend port file');
}

function getPreferredPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        if (!address || typeof address === 'string') {
          reject(new Error('Could not determine a free port'));
          return;
        }

        resolve(address.port);
      });
    });

    server.on('error', reject);
  });
}

async function startBackend() {
  if (backendProcess) {
    return readBackendUrl(getBackendPortFilePath(), 5000);
  }

  const runtimeRoot = getRuntimeRoot();
  const backendExecutable = getBackendExecutable(runtimeRoot);
  const portFilePath = getBackendPortFilePath();
  const preferredPort = await getPreferredPort();

  try {
    await fs.unlink(portFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  backendProcess = spawn(
    backendExecutable,
    [
      '--host',
      '127.0.0.1',
      '--port',
      String(preferredPort),
      '--web-dir',
      path.join(runtimeRoot, 'web'),
      '--port-file',
      portFilePath
    ],
    {
      cwd: app.getPath('userData'),
      env: {
        ...process.env
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  backendProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendProcess.once('exit', (code, signal) => {
    backendProcess = null;
    console.error(`Backend exited before app shutdown (code=${code}, signal=${signal})`);
  });

  backendProcess.once('error', (error) => {
    console.error('Failed to start backend', error);
  });

  return readBackendUrl(portFilePath, 15000);
}

async function createMainWindow() {
  const backendUrl = await startBackend();
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: '#f4f6f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  await window.loadURL(backendUrl);
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  backendProcess.removeAllListeners('exit');
  backendProcess.kill();
  backendProcess = null;
}

app.whenReady().then(async () => {
  ipcMain.handle(SELECT_DIRECTORY_CHANNEL, async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const result = await dialog.showOpenDialog(browserWindow, {
      title: 'Select ADJ Directory',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0] ?? null;
  });

  try {
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox(
      'ADJ Valet failed to start',
      error instanceof Error ? error.message : String(error)
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  ipcMain.removeHandler(SELECT_DIRECTORY_CHANNEL);
  stopBackend();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});
