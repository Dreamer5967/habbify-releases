# 🚀 Habbify (v1.0.0)

[![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)](https://github.com/Dreamer5967/habbify-releases/releases/tag/v1.0.0-release)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-brightgreen.svg)](https://github.com/Dreamer5967/habbify-releases/releases)
[![Build](https://img.shields.io/badge/built%20with-Electron%20%2B%20React-61dafb.svg)](https://electronjs.org)

> **The Ultimate All-in-One Gamified Habit, Fitness, Finance & Productivity Suite**

Habbify is a powerful, modern desktop application that unifies habit tracking, workout planning with color-indexed muscle maps, Pomodoro focus timers, personal goal tracking, financial budgeting, and real-time social leaderboards — all packaged into a sleek, themeable interface.

---

## 🌟 Features & Highlights

| Feature | Description |
| :--- | :--- |
| 🎯 **Habit Tracker** | 52-week GitHub-style contribution heatmaps, streak counters, and custom habit schedules. |
| 🏋️ **Gym Planner** | Interactive 10-group anatomical muscle diagram with precise color indexing & 60+ exercises. |
| 🧠 **Focus Timer** | Pomodoro timer with SVG progress rings, ambient sounds, and automated XP rewards. |
| 💰 **Finance Tracker** | Budget logging, category pie breakdown charts, and real-time net balance metrics. |
| 👥 **Social Leaderboard** | Real-time global & friends XP leaderboards powered by cloud sync. |
| 🍓 **25+ Themes** | Dark, Light, Dashboard, **Strawberry 🍓**, Ocean, Forest, Sunset, Midnight, Arcane, and custom styling. |

---

## 📥 Download Installers

Download the latest version for your platform from the [GitHub Releases](https://github.com/Dreamer5967/habbify-releases/releases/tag/v1.0.0-release) page:

* 🍏 **macOS Universal Installer**: [`Habbify-Installer.dmg`](https://github.com/Dreamer5967/habbify-releases/releases/download/v1.0.0-release/Habbify-Installer.dmg) (Supports Apple Silicon M1/M2/M3 & Intel Macs)
* 🍏 **macOS Portable ZIP**: [`Habbify-Installer.zip`](https://github.com/Dreamer5967/habbify-releases/releases/download/v1.0.0-release/Habbify-Installer.zip)
* 🪟 **Windows Installer**: [`Habbify-Windows.exe`](https://github.com/Dreamer5967/habbify-releases/releases/download/v1.0.0-release/Habbify-Windows.exe) (64-bit Windows Setup)
* 🪟 **Windows Portable ZIP**: [`Habbify-Windows.zip`](https://github.com/Dreamer5967/habbify-releases/releases/download/v1.0.0-release/Habbify-Windows.zip)

---

## 🛡️ Launch Instructions & Security Prompts

### 🪟 Windows ("Windows Protected Your PC")

If Windows SmartScreen displays the prompt *"Windows protected your PC / Unknown Publisher"*:

1. Click **More info** on the blue SmartScreen window.
2. Click **Run anyway** at the bottom to launch Habbify.

---

### 🍎 macOS ("Unidentified Developer / Cannot Be Opened")

If macOS Gatekeeper displays *"Habbify cannot be opened because it is from an unidentified developer"*:

#### **Method 1: Right-Click Open (Recommended — 2 Seconds)**
1. Open your Downloads folder and locate `Habbify.app` or `Habbify-Installer.dmg`.
2. **Right-click** (or hold `Control` and click) the Habbify icon.
3. Click **Open** from the dropdown menu.
4. In the pop-up modal, click **Open**. (macOS remembers this choice permanently).

#### **Method 2: System Settings**
1. Open **System Settings** > **Privacy & Security**.
2. Scroll down to **Security**.
3. Under *"Habbify was blocked from use"*, click **Open Anyway**.

#### **Method 3: Terminal Command**
```bash
sudo xattr -rd com.apple.quarantine /Applications/Habbify.app
```

---

## 🛠️ Building & Running From Source

### Requirements
- [Node.js](https://nodejs.org/) (v18.0 or later)
- `npm` (v9.0 or later)

### Commands
```bash
# 1. Clone the repository
git clone https://github.com/Dreamer5967/habbify-releases.git
cd habbify-releases

# 2. Install dependencies
npm install

# 3. Launch in development mode
npm run dev               # Vite web server
npm run electron:dev      # Vite + Electron desktop application

# 4. Build local production installer
npm run electron:build      # macOS Universal DMG & ZIP
npm run electron:build:win  # Windows NSIS EXE & ZIP
```

---

## 🤝 Contributing & Feedback

Contributions, feature suggestions, and bug reports are welcome! Feel free to open an issue or pull request on [GitHub](https://github.com/Dreamer5967/habbify-releases).

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
