// electron/main/windows.ts
import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1200, width - 100),
    height: Math.min(800, height - 100),
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#f0f0f0',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js'),
    },
    titleBarStyle: 'hidden',
    frame: false,
    resizable: true,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Enable dev tools shortcut (Ctrl+Shift+I) in production for debugging
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  // Show window on ready (user needs to configure settings first)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    logger.info('Main window ready and visible');
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      event.preventDefault();
      mainWindow.hide();
      logger.info('Main window hidden');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    logger.info('Main window closed');
  });

  logger.info('Main window created');
  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function showMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    logger.info('Main window shown and focused');
  }
}

export function hideMainWindow() {
  if (mainWindow) {
    mainWindow.hide();
    logger.info('Main window hidden');
  }
}

export function destroyMainWindow() {
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
    logger.info('Main window destroyed');
  }
}

