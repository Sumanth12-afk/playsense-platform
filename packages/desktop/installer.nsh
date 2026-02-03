; PlaySense Companion - Custom Installer with Password-Protected Uninstall
; Requires admin password to uninstall - uses VBScript InputBox

!include "LogicLib.nsh"

; Suppress warnings
!pragma warning disable 6001
!pragma warning disable 6010

!macro customHeader
!macroend

!macro customInit
!macroend

!macro customInstall
  ; Kill any existing processes first
  DetailPrint "Stopping any existing PlaySense processes..."
  nsExec::ExecToLog 'taskkill /F /IM "PlaySense Companion.exe"'
  Sleep 1000
  
  ; Auto-start with Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "PlaySenseCompanion" "$INSTDIR\PlaySense Companion.exe"
  
  ; Store configuration
  WriteRegStr HKLM "Software\PlaySense\Companion" "InstallDir" "$INSTDIR"
  
  ; Create tamper protection scheduled task
  DetailPrint "Setting up tamper protection..."
  nsExec::ExecToLog 'schtasks /Create /TN "PlaySenseGuardian" /TR "$INSTDIR\PlaySense Companion.exe" /SC MINUTE /MO 1 /F /RL HIGHEST'
!macroend

; This runs BEFORE uninstall - verify password here (electron-builder calls customUnInit, NOT un.onInit)
!macro customUnInit
  ; Kill the app first
  nsExec::ExecToLog 'taskkill /F /IM "PlaySense Companion.exe"'
  Sleep 1000
  
  ; Check if protected
  ReadRegStr $0 HKCU "Software\PlaySense\Companion" "AdminPassword"
  ReadRegStr $1 HKCU "Software\PlaySense\Companion" "AdminUsername"
  
  ${If} $0 == ""
  ${OrIf} $1 == ""
    ; Not protected - just confirm
    MessageBox MB_YESNO|MB_ICONQUESTION "Uninstall PlaySense Companion?" IDYES allow
    Abort
  ${EndIf}
  
  ; Protected - need password via VBScript InputBox
  ; Get username first
  FileOpen $2 "$TEMP\getuser.vbs" w
  FileWrite $2 'user = InputBox("Enter Admin Username to uninstall:", "PlaySense - Admin Required")$\r$\n'
  FileWrite $2 'If user = "" Then WScript.Quit 1$\r$\n'
  FileWrite $2 'Set fso = CreateObject("Scripting.FileSystemObject")$\r$\n'
  FileWrite $2 "Set f = fso.CreateTextFile($\"$TEMP\psuser.txt$\", True)$\r$\n"
  FileWrite $2 'f.Write user$\r$\n'
  FileWrite $2 'f.Close$\r$\n'
  FileClose $2
  
  nsExec::ExecToStack 'wscript "$TEMP\getuser.vbs"'
  Pop $3
  ${If} $3 != 0
    Delete "$TEMP\getuser.vbs"
    MessageBox MB_OK "Cancelled."
    Abort
  ${EndIf}
  
  FileOpen $2 "$TEMP\psuser.txt" r
  FileRead $2 $4
  FileClose $2
  Delete "$TEMP\getuser.vbs"
  Delete "$TEMP\psuser.txt"
  
  ; Get password
  FileOpen $2 "$TEMP\getpass.vbs" w
  FileWrite $2 'pass = InputBox("Enter Admin Password:", "PlaySense - Admin Required")$\r$\n'
  FileWrite $2 'If pass = "" Then WScript.Quit 1$\r$\n'
  FileWrite $2 'Set fso = CreateObject("Scripting.FileSystemObject")$\r$\n'
  FileWrite $2 "Set f = fso.CreateTextFile($\"$TEMP\pspass.txt$\", True)$\r$\n"
  FileWrite $2 'f.Write pass$\r$\n'
  FileWrite $2 'f.Close$\r$\n'
  FileClose $2
  
  nsExec::ExecToStack 'wscript "$TEMP\getpass.vbs"'
  Pop $3
  ${If} $3 != 0
    Delete "$TEMP\getpass.vbs"
    MessageBox MB_OK "Cancelled."
    Abort
  ${EndIf}
  
  FileOpen $2 "$TEMP\pspass.txt" r
  FileRead $2 $5
  FileClose $2
  Delete "$TEMP\getpass.vbs"
  Delete "$TEMP\pspass.txt"
  
  ; Encode and compare
  nsExec::ExecToStack 'powershell -NoProfile -Command "[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(''$4''))"'
  Pop $3
  Pop $6
  
  nsExec::ExecToStack 'powershell -NoProfile -Command "[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(''$5''))"'
  Pop $3
  Pop $7
  
  ; Trim newlines (PowerShell adds them)
  StrLen $8 $6
  IntOp $8 $8 - 2
  StrCpy $6 $6 $8
  
  StrLen $8 $7
  IntOp $8 $8 - 2
  StrCpy $7 $7 $8
  
  ; Compare with stored
  StrCmp $6 $1 0 wrong
  StrCmp $7 $0 0 wrong
  
  ; Correct!
  MessageBox MB_YESNO|MB_ICONQUESTION "Credentials verified. Proceed with uninstall?" IDYES allow
  Abort
  
  wrong:
  MessageBox MB_OK|MB_ICONSTOP "Incorrect username or password!"
  Abort
  
  allow:
!macroend

!macro customUnInstall
  ; Kill processes
  nsExec::ExecToLog 'taskkill /F /IM "PlaySense Companion.exe"'
  Sleep 1000
  
  ; Remove scheduled task
  nsExec::ExecToLog 'schtasks /Delete /TN "PlaySenseGuardian" /F'
  
  ; Remove auto-start
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "PlaySenseCompanion"
  
  ; Remove settings
  DeleteRegKey HKLM "Software\PlaySense"
  DeleteRegKey HKCU "Software\PlaySense"
  
  ; Clean up app data
  RMDir /r "$LOCALAPPDATA\playsense-companion"
  RMDir /r "$APPDATA\PlaySense Companion"
!macroend
