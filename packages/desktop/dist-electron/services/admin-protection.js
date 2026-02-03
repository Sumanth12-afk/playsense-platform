"use strict";
// electron/services/admin-protection.ts
// Requires admin USERNAME + PASSWORD to close app, uninstall, or change settings
// MANDATORY - cannot skip during setup
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProtection = void 0;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("../utils/logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class AdminProtectionService {
    constructor() {
        this.adminUsername = null;
        this.adminPassword = null;
        this.isLocked = true;
    }
    /**
     * Initialize admin protection
     * Checks if credentials are already set, forces setup if not
     */
    async initialize() {
        // Check if credentials are already set in registry
        const stored = await this.getStoredCredentials();
        if (stored) {
            this.adminUsername = stored.username;
            this.adminPassword = stored.password;
            this.isLocked = true;
            logger_1.logger.info('Admin protection initialized with existing credentials');
        }
        else {
            // No credentials set - check if child ID exists (meaning app is configured)
            try {
                const db = require('./database').getDatabase();
                const childIdResult = db
                    .prepare("SELECT value FROM settings WHERE key = 'child_id'")
                    .get();
                if (childIdResult?.value) {
                    // Child ID exists but no admin password - FORCE setup now!
                    logger_1.logger.info('App configured but no admin password - forcing setup');
                    // Give brief delay for window to be ready
                    setTimeout(async () => {
                        const credentialsSet = await this.promptSetCredentials();
                        if (!credentialsSet) {
                            logger_1.logger.warn('User refused to set admin credentials - app will remain unprotected');
                        }
                    }, 2000);
                }
                else {
                    logger_1.logger.info('Admin protection waiting for initial setup');
                }
            }
            catch (error) {
                logger_1.logger.error('Error checking child ID:', error);
            }
            this.isLocked = false;
        }
    }
    /**
     * Prompt user to set admin USERNAME and PASSWORD (MANDATORY after child ID setup)
     * This is called from the setup flow after child ID is entered
     */
    async promptSetCredentials() {
        await electron_1.dialog.showMessageBox({
            type: 'info',
            title: 'Admin Protection Required',
            message: 'Protect Your Monitoring App',
            detail: 'To prevent your child from closing or uninstalling this app, you must set an admin username and password.\n\nYou will need BOTH to:\n• Close the app\n• Uninstall the app\n• Change settings\n• Disable monitoring\n\nThis step is MANDATORY for security.',
            buttons: ['Continue'],
            defaultId: 0,
            noLink: true,
        });
        // Show username + password setup dialog
        const credentials = await this.showCredentialsDialog('Set Admin Credentials', 'Create admin username and password to protect this app:', true // isSetup mode
        );
        if (credentials) {
            // Confirm password
            const confirmPassword = await this.showPasswordDialog('Confirm Password', 'Re-enter your password to confirm:');
            if (credentials.password === confirmPassword) {
                this.adminUsername = credentials.username;
                this.adminPassword = credentials.password;
                await this.storeCredentials(credentials.username, credentials.password);
                this.isLocked = true;
                electron_1.dialog.showMessageBox({
                    type: 'info',
                    title: 'Admin Protection Enabled',
                    message: 'Admin credentials set successfully!',
                    detail: `Username: ${credentials.username}\n\n⚠️ IMPORTANT: Write these down in a safe place!\n\nYou will need BOTH username and password to close or uninstall the app.`,
                });
                logger_1.logger.info('Admin credentials set successfully');
                return true;
            }
            else {
                electron_1.dialog.showMessageBox({
                    type: 'error',
                    title: 'Passwords Do Not Match',
                    message: 'The passwords you entered do not match. Please try again.',
                });
                // Retry
                return await this.promptSetCredentials();
            }
        }
        else {
            // User cancelled - force them to set it (MANDATORY)
            const { response: retryResponse } = await electron_1.dialog.showMessageBox({
                type: 'warning',
                title: 'Admin Protection Required',
                message: 'You MUST set admin credentials to continue.',
                detail: 'This is a security requirement to prevent your child from disabling monitoring. The app cannot run without admin protection.',
                buttons: ['Try Again', 'Exit App'],
                defaultId: 0,
                cancelId: 1,
            });
            if (retryResponse === 0) {
                return await this.promptSetCredentials(); // Retry
            }
            else {
                electron_1.app.quit(); // User chose to exit
                return false;
            }
        }
    }
    /**
     * Show combined username + password input dialog
     */
    async showCredentialsDialog(title, message, isSetup = false) {
        return new Promise((resolve) => {
            const win = new electron_1.BrowserWindow({
                width: 500,
                height: isSetup ? 420 : 380,
                modal: true,
                show: false,
                resizable: false,
                minimizable: false,
                maximizable: false,
                center: true,
                title: 'PlaySense - Admin Verification',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                },
            });
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 20px;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 { margin-top: 0; color: #333; font-size: 20px; }
            p { color: #666; font-size: 14px; margin-bottom: 20px; }
            label {
              display: block;
              margin-bottom: 5px;
              color: #333;
              font-size: 13px;
              font-weight: 500;
            }
            input {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;
              box-sizing: border-box;
            }
            input:focus {
              outline: none;
              border-color: #667eea;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-right: 10px;
            }
            button:hover { background: #5568d3; }
            button.cancel {
              background: #ccc;
              color: #333;
              ${isSetup ? 'display: none;' : ''}
            }
            button.cancel:hover { background: #bbb; }
            .hint {
              font-size: 12px;
              color: #999;
              margin-top: -10px;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${title}</h2>
            <p>${message}</p>
            
            <label for="username">Admin Username</label>
            <input type="text" id="username" placeholder="Enter username" autofocus autocomplete="off" />
            ${isSetup ? '<div class="hint">Choose a username only you will remember</div>' : ''}
            
            <label for="password">Admin Password</label>
            <input type="password" id="password" placeholder="Enter password" autocomplete="off" />
            ${isSetup ? '<div class="hint">Choose a strong password</div>' : ''}
            
            <div>
              <button onclick="submit()">OK</button>
              <button class="cancel" onclick="cancel()">Cancel</button>
            </div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            
            function submit() {
              const username = document.getElementById('username').value.trim();
              const password = document.getElementById('password').value;
              
              if (!username || !password) {
                alert('Please enter both username and password');
                return;
              }
              
              ipcRenderer.send('credentials-result', { username, password });
            }
            
            function cancel() {
              ipcRenderer.send('credentials-result', null);
            }
            
            document.getElementById('password').addEventListener('keypress', (e) => {
              if (e.key === 'Enter') submit();
            });
          </script>
        </body>
        </html>
      `;
            win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            win.once('ready-to-show', () => win.show());
            const { ipcMain } = require('electron');
            ipcMain.once('credentials-result', (_event, result) => {
                win.close();
                resolve(result);
            });
        });
    }
    /**
     * Show password-only input dialog (for confirmation)
     */
    async showPasswordDialog(title, message) {
        return new Promise((resolve) => {
            const win = new electron_1.BrowserWindow({
                width: 400,
                height: 250,
                modal: true,
                show: false,
                resizable: false,
                minimizable: false,
                maximizable: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                },
            });
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 20px;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 { margin-top: 0; color: #333; }
            p { color: #666; font-size: 14px; }
            input {
              width: 100%;
              padding: 10px;
              margin: 15px 0;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;
              box-sizing: border-box;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-right: 10px;
            }
            button:hover { background: #5568d3; }
            button.cancel {
              background: #ccc;
              color: #333;
            }
            button.cancel:hover { background: #bbb; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${title}</h2>
            <p>${message}</p>
            <input type="password" id="password" placeholder="Enter password" autofocus />
            <div>
              <button onclick="submit()">OK</button>
              <button class="cancel" onclick="cancel()">Cancel</button>
            </div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            
            function submit() {
              const password = document.getElementById('password').value;
              ipcRenderer.send('password-result', password);
            }
            
            function cancel() {
              ipcRenderer.send('password-result', null);
            }
            
            document.getElementById('password').addEventListener('keypress', (e) => {
              if (e.key === 'Enter') submit();
            });
          </script>
        </body>
        </html>
      `;
            win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            win.once('ready-to-show', () => win.show());
            const { ipcMain } = require('electron');
            ipcMain.once('password-result', (_event, password) => {
                win.close();
                resolve(password);
            });
        });
    }
    /**
     * Verify admin USERNAME + PASSWORD before allowing action
     */
    async verifyAdmin(action) {
        if (!this.isLocked || !this.adminUsername || !this.adminPassword) {
            return true; // No credentials set, allow action
        }
        const entered = await this.showCredentialsDialog('Admin Credentials Required', `Enter admin username and password to ${action}:`, false);
        if (entered && entered.username === this.adminUsername && entered.password === this.adminPassword) {
            logger_1.logger.info(`Admin verified for action: ${action}`);
            return true;
        }
        else {
            if (entered !== null) {
                electron_1.dialog.showMessageBox({
                    type: 'error',
                    title: 'Incorrect Credentials',
                    message: 'The username or password you entered is incorrect.',
                });
            }
            logger_1.logger.warn(`Failed admin verification for action: ${action}`);
            return false;
        }
    }
    /**
     * Store username + password in Windows registry (encoded)
     */
    async storeCredentials(username, password) {
        if (process.platform !== 'win32')
            return;
        try {
            // Simple encoding (not secure, but better than plain text)
            const encodedUsername = Buffer.from(username).toString('base64');
            const encodedPassword = Buffer.from(password).toString('base64');
            await execAsync(`reg add "HKCU\\Software\\PlaySense\\Companion" /v AdminUsername /t REG_SZ /d "${encodedUsername}" /f`);
            await execAsync(`reg add "HKCU\\Software\\PlaySense\\Companion" /v AdminPassword /t REG_SZ /d "${encodedPassword}" /f`);
            // Set Protected flag - this blocks uninstall via NSIS
            await execAsync(`reg add "HKCU\\Software\\PlaySense\\Companion" /v Protected /t REG_SZ /d "1" /f`);
            logger_1.logger.info('Admin credentials stored in registry with Protected flag');
        }
        catch (error) {
            logger_1.logger.error('Failed to store credentials:', error);
        }
    }
    /**
     * Get stored username + password from registry
     */
    async getStoredCredentials() {
        if (process.platform !== 'win32')
            return null;
        try {
            const { stdout: usernameOutput } = await execAsync('reg query "HKCU\\Software\\PlaySense\\Companion" /v AdminUsername');
            const { stdout: passwordOutput } = await execAsync('reg query "HKCU\\Software\\PlaySense\\Companion" /v AdminPassword');
            const usernameMatch = usernameOutput.match(/AdminUsername\s+REG_SZ\s+(.+)/);
            const passwordMatch = passwordOutput.match(/AdminPassword\s+REG_SZ\s+(.+)/);
            if (usernameMatch && usernameMatch[1] && passwordMatch && passwordMatch[1]) {
                const username = Buffer.from(usernameMatch[1].trim(), 'base64').toString('utf-8');
                const password = Buffer.from(passwordMatch[1].trim(), 'base64').toString('utf-8');
                return { username, password };
            }
        }
        catch {
            // Keys don't exist
        }
        return null;
    }
    /**
     * Remove stored credentials (for uninstall)
     */
    async removeCredentials() {
        if (process.platform !== 'win32')
            return;
        try {
            await execAsync('reg delete "HKCU\\Software\\PlaySense\\Companion" /v AdminUsername /f');
            await execAsync('reg delete "HKCU\\Software\\PlaySense\\Companion" /v AdminPassword /f');
            logger_1.logger.info('Admin credentials removed from registry');
        }
        catch (error) {
            logger_1.logger.error('Failed to remove credentials:', error);
        }
    }
    /**
     * Check if admin protection is active
     */
    isProtectionActive() {
        return this.isLocked && this.adminUsername !== null && this.adminPassword !== null;
    }
    /**
     * Set credentials from the React onboarding UI
     * This replaces the old native dialog approach
     */
    async setCredentialsFromUI(username, password) {
        try {
            this.adminUsername = username;
            this.adminPassword = password;
            await this.storeCredentials(username, password);
            this.isLocked = true;
            logger_1.logger.info('Admin credentials set from React UI');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to set credentials from UI:', error);
            return false;
        }
    }
    /**
     * Get stored password (for uninstall verification)
     * Returns the password if set, null otherwise
     */
    async getStoredPassword() {
        const credentials = await this.getStoredCredentials();
        return credentials ? credentials.password : null;
    }
    /**
     * Require admin credentials before quitting app
     * If verified, also removes protection flag to allow uninstall
     */
    async canQuit() {
        const verified = await this.verifyAdmin('close the app');
        if (verified) {
            // Remove protection flag so uninstall is allowed
            try {
                await execAsync('reg delete "HKCU\\Software\\PlaySense\\Companion" /v Protected /f');
                logger_1.logger.info('Removed protection flag - uninstall now allowed');
            }
            catch (error) {
                logger_1.logger.error('Failed to remove protection flag:', error);
            }
        }
        return verified;
    }
    /**
     * Require admin credentials before uninstalling
     */
    async canUninstall() {
        return await this.verifyAdmin('uninstall the app');
    }
    /**
     * Require admin credentials before changing settings
     */
    async canChangeSettings() {
        return await this.verifyAdmin('change settings');
    }
}
exports.adminProtection = new AdminProtectionService();
exports.default = exports.adminProtection;
