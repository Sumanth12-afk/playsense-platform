// electron/services/tamper-protection.ts
// Provides protection against the app being killed from Task Manager
// Uses Windows Task Scheduler to ensure the app restarts if terminated

import { app } from 'electron';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

const TASK_NAME = 'PlaySenseGuardian';


class TamperProtectionService {
  private watchdogProcess: ReturnType<typeof spawn> | null = null;
  private isProduction: boolean = false;

  constructor() {
    this.isProduction = app.isPackaged;
  }

  /**
   * Initialize tamper protection
   * - Creates Windows Task Scheduler entry for auto-restart
   * - Starts watchdog process for immediate restart on kill
   */
  async initialize(): Promise<void> {
    if (process.platform !== 'win32') {
      logger.info('Tamper protection only available on Windows');
      return;
    }

    try {
      // Register with Windows Task Scheduler for system-level protection
      await this.registerScheduledTask();

      // Start the watchdog script
      this.startWatchdog();

      logger.info('Tamper protection initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize tamper protection:', error);
    }
  }

  /**
   * Register a Windows Scheduled Task that runs on login and monitors the app
   */
  private async registerScheduledTask(): Promise<void> {
    const exePath = this.getExecutablePath();

    if (!exePath) {
      logger.warn('Cannot register scheduled task: executable path not found');
      return;
    }

    try {
      // Check if task already exists
      const { stdout } = await execAsync(`schtasks /query /tn "${TASK_NAME}" 2>nul`);

      if (stdout.includes(TASK_NAME)) {
        logger.info('Scheduled task already exists');
        return;
      }
    } catch {
      // Task doesn't exist, create it
    }

    try {
      // Create a scheduled task that:
      // 1. Runs on user login
      // 2. Runs every 5 minutes as a backup
      // 3. Restarts the app if it's not running

      const taskXml = this.generateTaskXml(exePath);
      const tempXmlPath = path.join(app.getPath('temp'), 'playsense-task.xml');

      fs.writeFileSync(tempXmlPath, taskXml);

      await execAsync(`schtasks /create /tn "${TASK_NAME}" /xml "${tempXmlPath}" /f`);

      // Clean up temp file
      fs.unlinkSync(tempXmlPath);

      logger.info('Scheduled task registered successfully');
    } catch (error) {
      logger.error('Failed to register scheduled task:', error);
    }
  }

  /**
   * Generate Windows Task Scheduler XML
   */
  private generateTaskXml(exePath: string): string {
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
  private startWatchdog(): void {
    if (!this.isProduction) {
      logger.info('Watchdog disabled in development mode');
      return;
    }

    const exePath = this.getExecutablePath();
    if (!exePath) return;

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

    const scriptPath = path.join(app.getPath('userData'), 'watchdog.ps1');
    fs.writeFileSync(scriptPath, watchdogScript);

    // Start the watchdog as a detached process
    this.watchdogProcess = spawn('powershell.exe',
      ['-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', scriptPath],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }
    );

    // Unref so the main process can exit
    this.watchdogProcess.unref();

    logger.info('Watchdog process started');
  }

  /**
   * Get the path to the executable
   */
  private getExecutablePath(): string | null {
    if (this.isProduction) {
      return app.getPath('exe');
    }

    // In development, return null (don't register tasks)
    return null;
  }

  /**
   * Remove scheduled task (for uninstall)
   */
  async removeScheduledTask(): Promise<void> {
    if (process.platform !== 'win32') return;

    try {
      await execAsync(`schtasks /delete /tn "${TASK_NAME}" /f`);
      logger.info('Scheduled task removed');
    } catch (error) {
      logger.error('Failed to remove scheduled task:', error);
    }
  }

  /**
   * Stop the watchdog process
   */
  stopWatchdog(): void {
    if (this.watchdogProcess) {
      this.watchdogProcess.kill();
      this.watchdogProcess = null;
      logger.info('Watchdog stopped');
    }
  }

  /**
   * Check if protection is active
   */
  async isProtectionActive(): Promise<boolean> {
    if (process.platform !== 'win32') return false;

    try {
      const { stdout } = await execAsync(`schtasks /query /tn "${TASK_NAME}" 2>nul`);
      return stdout.includes(TASK_NAME);
    } catch {
      return false;
    }
  }
}

export const tamperProtection = new TamperProtectionService();
export default tamperProtection;
