"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCrashReporter = initCrashReporter;
// electron/main/crash-reporter.ts
const electron_1 = require("electron");
const logger_1 = require("../utils/logger");
function initCrashReporter() {
    electron_1.crashReporter.start({
        productName: 'PlaySense Companion',
        companyName: 'PlaySense',
        submitURL: '', // Add your crash report endpoint
        uploadToServer: false,
    });
    logger_1.logger.info('Crash reporter initialized');
}
