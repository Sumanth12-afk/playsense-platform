"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
exports.getMainWindow = getMainWindow;
exports.showMainWindow = showMainWindow;
exports.hideMainWindow = hideMainWindow;
exports.destroyMainWindow = destroyMainWindow;
// electron/main/windows.ts
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
let mainWindow = null;
function createMainWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
        width: Math.min(1200, width - 100),
        height: Math.min(800, height - 100),
        minWidth: 800,
        minHeight: 600,
        show: false,
        backgroundColor: '#f0f0f0',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, '../preload.js'),
        },
        titleBarStyle: 'hidden',
        frame: false,
        resizable: true,
    });
    // Load the app
    if (process.env.NODE_ENV === 'development') {
        const devUrl = 'http://localhost:5173';
        let retryCount = 0;
        const maxRetries = 15; // ~30 seconds total
        const tryLoad = () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadURL(devUrl);
            }
        };
        mainWindow.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
            if (errorDescription?.includes('ERR_CONNECTION_REFUSED') &&
                retryCount < maxRetries &&
                mainWindow &&
                !mainWindow.isDestroyed()) {
                retryCount++;
                logger_1.logger.warn(`Dev server not ready, retrying (${retryCount}/${maxRetries})...`);
                setTimeout(tryLoad, 2000);
            }
        });
        tryLoad();
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../../dist/index.html'));
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
        logger_1.logger.info('Main window ready and visible');
    });
    // Handle window close
    mainWindow.on('close', (event) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            event.preventDefault();
            mainWindow.hide();
            logger_1.logger.info('Main window hidden');
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        logger_1.logger.info('Main window closed');
    });
    logger_1.logger.info('Main window created');
    return mainWindow;
}
function getMainWindow() {
    return mainWindow;
}
function showMainWindow() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        logger_1.logger.info('Main window shown and focused');
    }
}
function hideMainWindow() {
    if (mainWindow) {
        mainWindow.hide();
        logger_1.logger.info('Main window hidden');
    }
}
function destroyMainWindow() {
    if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
        logger_1.logger.info('Main window destroyed');
    }
}
