# File Shifter — Node.js Local File Transfer & Relay Server

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-blue)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Stable-success)](#)

File Shifter is a local web server for transferring and streaming files between devices on a LAN. It is implemented using only Node.js core modules and HTTP — no Express, no WebSocket libraries — and serves as an educational project to explore how request parsing, streaming, and related internals work.

## Table of Contents
- Features
- Technical overview
- Installation & usage
  - Windows: installation & first run
  - Manual start
- How it works
- License

## Features

### 1. Direct File Sending
- Send files directly to the main (server) PC.
- Pause / Resume support for each file transfer.
- Real-time progress and transfer speed indicators for each file operation.
- Chunk-based upload system for reliable resumable transfers.

### 2. Live Sending Mode
- Live streaming to any connected device using the server as a relay.
- Recipients can access files while they are being uploaded (streamed).
- Pause / Resume is not supported in live mode (continuous relay).
- Intended for testing streaming and relay behavior over HTTP.

### 3. QR Integration
- QR code generation for quick access; QR displayed in both terminal and web UI.
- Server link/URL updates when the network IP or server session changes.

### 4. Windows Installer
- Includes `install.ps1` that automates Node.js and package installation and prepares the app for immediate use.
- Installer generates `app.ps1`, which is the recommended launcher for regular use.

## Technical overview

- Language: Node.js (no frameworks)
- Protocol: HTTP
- Core concepts implemented manually:
  - HTTP request parsing
  - Body parsing for form and binary uploads
  - Cookie parsing and handling
  - URL parsing and routing
  - Stream-based file I/O and chunked transfers
  - Device Identity verification.
- Frontend: HTML5 + Vanilla JavaScript + Tailwind CSS.
- Installer: PowerShell script (`install.ps1`)
- **Purpose: Educational** — to implement and observe how Express-like features operate at a lower level

## Installation & usage

### Windows: Installation & First Run (exact procedure)
Follow these exact steps to install and launch on Windows.

1. Open PowerShell as Administrator.

2. Temporarily allow script execution for this session:
   ```powershell
   Set-ExecutionPolicy Bypass
3. **Than connect to Internet about 40mb of data required for first time installation**.

4. Donload **File shifter** and than Extract the zip file and run `install.ps1` run with powershell.

5. Than a new `app.ps1` will be created run it with powershell also.
### Linux: Installation & First Run 

1. Install nodejs first. Install dependencies and start.
Go to file_shifter dir and open it 
with terminal.
    ```bash
    sudo apt install nodejs
    npm install
    npm start

How it Works
  -
- Follow the instruction given in terminal.
- THe user interface is easy and user focused so you will easily find what to do. 
- THe screeshot are given here:

### ScreenShots
  - **Terminal**

  - **HomePage**
    <img width="1304" height="608" alt="image" src="https://github.com/user-attachments/assets/d1a88bfd-b045-4e45-ae84-7ae9fa299b21" />

  - **Live Send**
    - Selecting Device:
      <img width="1304" height="608" alt="image" src="https://github.com/user-attachments/assets/7daa0fab-e43b-4d5b-a76f-5af5e6964840" />
    - Sending Files:
      <img width="1100" height="728" alt="image" src="https://github.com/user-attachments/assets/1037eaf1-59fa-48d6-8baa-60baf9a09563" />

  - **Receive**
    <img width="1338" height="725" alt="image" src="https://github.com/user-attachments/assets/3ec8e43f-67a0-47d3-ab97-f8be6c7eba14" />

  - **Send To Server Direct**

## Licence
**GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007.**
  
**Copyright (c) 2025 Usman Ghani**

  
  
