// electron/utils/platform.ts
import os from 'os';

export function getPlatform(): 'windows' | 'mac' | 'linux' | 'unknown' {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'mac';
  if (platform === 'linux') return 'linux';
  return 'unknown';
}

export function getDeviceInfo() {
  return {
    platform: getPlatform(),
    hostname: os.hostname(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    osVersion: os.version(),
  };
}

export function isAdmin(): boolean {
  const platform = process.platform;
  
  if (platform === 'win32') {
    // On Windows, check if running as admin
    return process.env.USERNAME === 'Administrator';
  }
  
  if (platform === 'darwin' || platform === 'linux') {
    // On Unix-like systems, check if UID is 0
    return process.getuid?.() === 0;
  }
  
  return false;
}

