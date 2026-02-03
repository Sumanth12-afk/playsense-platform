"use strict";
// electron/services/tamper-protection.ts
// Provides protection against the app being killed from Task Manager
// Uses Windows Task Scheduler to ensure the app restarts if terminated
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamperProtection = void 0;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const TASK_NAME = 'PlaySenseGuardian';
class TamperProtectionService {
    constructor() {
        this.watchdogProcess = null;
        this.isProduction = false;
        this.isProduction = electron_1.app.isPackaged;
    }
    /**
     * Initialize tamper protection
     * - Creates Windows Task Scheduler entry for auto-restart
     * - Starts watchdog process for immediate restart on kill
     */
    async initialize() {
        if (process.platform !== 'win32') {
            logger_1.logger.info('Tamper protection only available on Windows');
            return;
        }
        try {
            // Register with Windows Task Scheduler for system-level protection
            await this.registerScheduledTask();
            // Start the watchdog script
            this.startWatchdog();
            logger_1.logger.info('Tamper protection initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize tamper protection:', error);
        }
    }
    /**
     * Register a Windows Scheduled Task that runs on login and monitors the app
     */
    async registerScheduledTask() {
        const exePath = this.getExecutablePath();
        if (!exePath) {
            logger_1.logger.warn('Cannot register scheduled task: executable path not found');
            return;
        }
        try {
            // Check if task already exists
            const { stdout } = await execAsync(`schtasks /query /tn "${TASK_NAME}" 2>nul`);
            if (stdout.includes(TASK_NAME)) {
                logger_1.logger.info('Scheduled task already exists');
                return;
            }
        }
        catch {
            // Task doesn't exist, create it
        }
        try {
            // Create a scheduled task that:
            // 1. Runs on user login
            // 2. Runs every 5 minutes as a backup
            // 3. Restarts the app if it's not running
            const taskXml = this.generateTaskXml(exePath);
            const tempXmlPath = path_1.default.join(electron_1.app.getPath('temp'), 'playsense-task.xml');
            fs_1.default.writeFileSync(tempXmlPath, taskXml);
            await execAsync(`schtasks /create /tn "${TASK_NAME}" /xml "${tempXmlPath}" /f`);
            // Clean up temp file
            fs_1.default.unlinkSync(tempXmlPath);
            logger_1.logger.info('Scheduled task registered successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to register scheduled task:', error);
        }
    }
    /**
     * Generate Windows Task Scheduler XML
     */
    generateTaskXml(exePath) {
        const escapedPath = exePath.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>PlaySense Guardian - Ensures PlaySense stays running</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
    <TimeTrigger>
      <Repetition>
        <Interval>PT5M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2024-01-01T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>true</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${escapedPath}</Command>
      <Arguments>--hidden</Arguments>
    </Exec>
  </Actions>
</Task>`;
    }
    /**
     * Start a watchdog process that monitors and restarts the app
     */
    startWatchdog() {
        if (!this.isProduction) {
            logger_1.logger.info('Watchdog disabled in development mode');
            return;
        }
        const exePath = this.getExecutablePath();
        if (!exePath)
            return;
        // Create a PowerShell watchdog script
        const watchdogScript = `
$processName = "PlaySense"
$exePath = "${exePath.replace(/\\/g, '\\\\')}"

while ($true) {
  Start-Sleep -Seconds 5
  $process = Get-Process -Name $processName -ErrorAction SilentlyContinue
  if (-not $process) {
    Start-Process -FilePath $exePath -ArgumentList "--hidden" -WindowStyle Hidden
  }
}
`;
        const scriptPath = path_1.default.join(electron_1.app.getPath('userData'), 'watchdog.ps1');
        fs_1.default.writeFileSync(scriptPath, watchdogScript);
        // Start the watchdog as a detached process
        this.watchdogProcess = (0, child_process_1.spawn)('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', scriptPath], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });
        // Unref so the main process can exit
        this.watchdogProcess.unref();
        logger_1.logger.info('Watchdog process started');
    }
    /**
     * Get the path to the executable
     */
    getExecutablePath() {
        if (this.isProduction) {
            return electron_1.app.getPath('exe');
        }
        // In development, return null (don't register tasks)
        return null;
    }
    /**
     * Remove scheduled task (for uninstall)
     */
    async removeScheduledTask() {
        if (process.platform !== 'win32')
            return;
        try {
            await execAsync(`schtasks /delete /tn "${TASK_NAME}" /f`);
            logger_1.logger.info('Scheduled task removed');
        }
        catch (error) {
            logger_1.logger.error('Failed to remove scheduled task:', error);
        }
    }
    /**
     * Stop the watchdog process
     */
    stopWatchdog() {
        if (this.watchdogProcess) {
            this.watchdogProcess.kill();
            this.watchdogProcess = null;
            logger_1.logger.info('Watchdog stopped');
        }
    }
    /**
     * Check if protection is active
     */
    async isProtectionActive() {
        if (process.platform !== 'win32')
            return false;
        try {
            const { stdout } = await execAsync(`schtasks /query /tn "${TASK_NAME}" 2>nul`);
            return stdout.includes(TASK_NAME);
        }
        catch {
            return false;
        }
    }
}
exports.tamperProtection = new TamperProtectionService();
exports.default = exports.tamperProtection;
