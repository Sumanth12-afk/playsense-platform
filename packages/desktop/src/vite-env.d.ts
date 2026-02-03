// src/vite-env.d.ts
/// <reference types="vite/client" />

import { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

