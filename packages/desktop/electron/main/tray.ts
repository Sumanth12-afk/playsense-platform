// electron/main/tray.ts
import { Menu, Tray, nativeImage } from 'electron';
import { logger } from '../utils/logger';

let tray: Tray | null = null;

export function createTray(onShow: () => void, onQuit: () => void) {
  try {
    // Create a simple 16x16 icon using native image
    // We'll create a small colored square as a fallback
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    
    // Fill with a green color (RGBA)
    for (let i = 0; i < canvas.length; i += 4) {
      canvas[i] = 52;      // R - primary green
      canvas[i + 1] = 211; // G
      canvas[i + 2] = 153; // B
      canvas[i + 3] = 255; // A
    }
    
    const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
    
    tray = new Tray(icon);
    tray.setToolTip('PlaySense Companion');

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🎮 Open PlaySense Dashboard',
        click: onShow,
        type: 'normal',
      },
      {
        type: 'separator',
      },
      {
        label: '✅ Monitoring Active',
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: '❌ Quit PlaySense',
        click: onQuit,
      },
    ]);

    tray.setContextMenu(contextMenu);
    
    // Double-click to show window
    tray.on('double-click', onShow);

    logger.info('System tray created');
    return tray;
  } catch (error) {
    logger.error('Failed to create tray:', error);
    return null;
  }
}

export function updateTrayIcon(status: 'default' | 'active' | 'warning') {
  if (!tray) return;

  try {
    // Using simple colored icon for now
    // Could be customized based on status later
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    
    // Color based on status
    let r = 52, g = 211, b = 153; // default green
    if (status === 'active') {
      r = 59; g = 130; b = 246; // blue when active
    } else if (status === 'warning') {
      r = 239; g = 68; b = 68; // red for warning
    }
    
    for (let i = 0; i < canvas.length; i += 4) {
      canvas[i] = r;
      canvas[i + 1] = g;
      canvas[i + 2] = b;
      canvas[i + 3] = 255;
    }
    
    const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
    tray.setImage(icon);
  } catch (error) {
    logger.error('Failed to update tray icon:', error);
  }
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
    logger.info('System tray destroyed');
  }
}

