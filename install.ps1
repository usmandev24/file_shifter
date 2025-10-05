#--------------------------copyright c 2025 Usman Ghani (usmandev24) ----------------------
# -----------------------------------------------------------------------------------------
# Note: Internet connection is required for the first-time installation and app execution.
#
# ----------------------------- Follow these steps ----------------------------------------
#
# 1. Open PowerShell as Administrator and run the following command:
#        Set-ExecutionPolicy Bypass
#
# 2. Right-click this script file and select:
#        Run with PowerShell
#
# 3. After successful installation, open "app.ps1" with PowerShell to start the app.
#
# -----------------------------------------------------------------------------------------

$OriginalDir = $PSScriptRoot
Write-Output "Working directory: $OriginalDir"

# Check if Node.js and npm are available
if ((Get-Command node -ErrorAction SilentlyContinue) -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Output "Node.js and npm are already installed."
} else {
    Write-Output "Node.js or npm not found."

    # Test internet connection
    $connected = Test-Connection -ComputerName google.com -Count 1 -Quiet
    if (-not $connected) {
        Write-Output "`n-------------------------------------------"
        Write-Output "Internet connection not detected."
        Write-Output "Please connect to the internet and try again."
        Write-Output "-------------------------------------------`n"
        Start-Sleep -Seconds 3
        exit 1
    }

    # Check for admin privileges
    if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Output "Administrator privileges are required. Relaunching as Administrator..."
        Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $PSCommandPath) -Verb RunAs
        exit
    }
    Write-OutPut "File Shifter required Node.js to run.."
    Write-Output "Downloading Node.js installer..."
    $installerUrl = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi"
    $installerPath = "$env:TEMP\nodejs.msi"

    Write-Output "Downloading from: $installerUrl"
    Write-Output "About 30MB of data will be dowloaded."
    Write-Output "....... 29 MB remaining"
    Write-Output "........ do not close this window (even progress is not showing but download is happening.)"
    $ProgressPreference = 'SilentlyContinue'
    try {
    #Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    Write-Output "Download completed successfully."
} catch {
    Write-Output "Download failed: $($_.Exception.Message)"
    Start-Sleep -Seconds 3
    exit 1
}
    $ProgressPreference = 'continue'
    Write-Output "Installer downloaded to: $installerPath"

    Write-Output "Starting Node.js installation..."
    try {
        $process = Start-Process -FilePath "msiexec.exe" `
                                 -ArgumentList @("/i", $installerPath, "/qn") `
                                 -Wait -PassThru

        if ($process.ExitCode -ne 0) {
            throw "Installation failed with exit code $($process.ExitCode)"
        }

        Write-Output "Node.js installation completed successfully."
    }
    catch {
        Write-Output "Node.js installation failed: $($_.Exception.Message)"
        Start-Sleep -Seconds 5
        exit 1
    }
}
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + `
             [System.Environment]::GetEnvironmentVariable("Path","User")

# Restore working directory
Set-Location $OriginalDir
Start-Sleep -Seconds 2


$content = @'
#--------------------------copyright 2025 Usman Ghani (usmandev24) ------------------------
#--------------Note :------Start with powershell ------------------------------------------
Write-Output "To stop the app, press Ctrl + C."
npm start
Write-Output "Exiting..."
Start-Sleep -Seconds 5
exit
'@
Set-Content -Path ".\app.ps1" -Value $content

Write-Output "Running npm install..."
try {
 npm install
 if ($lastExitCode -ne 0) {
 throw "Npm install Error "
 }
} catch {
 write-output "Error Occured check your connection and try again"
 write-output "Existing in 3s ........"
 start-sleep -seconds 3
 exit 1
}
Write-Output "Installation completed successfully."
write-output ""

Write-OutPut "---------------- Open app.ps1 with PowerShell and start File shifter ------------"
write-output ""
Write-Output "Setup finished. Exiting in 10 seconds..."
Start-Sleep -Seconds 10
exit
