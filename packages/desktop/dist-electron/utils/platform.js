"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatform = getPlatform;
exports.getDeviceInfo = getDeviceInfo;
exports.isAdmin = isAdmin;
// electron/utils/platform.ts
const os_1 = __importDefault(require("os"));
function getPlatform() {
    const platform = process.platform;
    if (platform === 'win32')
        return 'windows';
    if (platform === 'darwin')
        return 'mac';
    if (platform === 'linux')
        return 'linux';
    return 'unknown';
}
function getDeviceInfo() {
    return {
        platform: getPlatform(),
        hostname: os_1.default.hostname(),
        arch: os_1.default.arch(),
        cpus: os_1.default.cpus().length,
        totalMemory: os_1.default.totalmem(),
        osVersion: os_1.default.version(),
    };
}
function isAdmin() {
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
