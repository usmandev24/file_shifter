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
- Learning objectives
- Future enhancements
- License
- Credits
- Demo / screenshots

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
- Frontend: HTML5 + Vanilla JavaScript
- Installer: PowerShell script (`install.ps1`)
- Purpose: Educational — to implement and observe how Express-like features operate at a lower level

## Installation & usage

### Windows: Installation & First Run (exact procedure)
Follow these exact steps to install and launch on Windows.

1. Open PowerShell as Administrator.

2. Temporarily allow script execution for this session:
   ```powershell
   Set-ExecutionPolicy Bypass
**Internet connection required for installation**
3. Extract the zip file and run `install.ps1` run with powershell
4. Than a new `app.ps1` will be created run it with powershell also
