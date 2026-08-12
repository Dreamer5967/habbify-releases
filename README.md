# 🚀 Habbify (v1.0.0)

[![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)](https://github.com/Dreamer5967/habbify-releases/releases/tag/v1.0.0-release)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-brightgreen.svg)](https://github.com/Dreamer5967/habbify-releases/releases)
[![Build](https://img.shields.io/badge/built%20with-Electron%20%2B%20React-61dafb.svg)](https://electronjs.org)

> **The Ultimate All-in-One Gamified Habit, Fitness, Finance & Productivity Suite**

Habbify is a powerful, modern desktop application that unifies habit tracking, workout planning with color-indexed muscle maps, Pomodoro focus timers, personal goal tracking, financial budgeting, and real-time social leaderboards — all packaged into a sleek, themeable interface.

---

## 📸 Screenshots & Highlights

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

## 🛡️ Security Warnings & Windows Defender False Positives Explained

### Why does Windows Defender or macOS display a warning?

Habbify is **100% open-source, clean, and free of malware**. Security prompts occur because Habbify is built by an independent developer without purchasing commercial code-signing certificates (Apple Developer Program costs $99/year & Windows EV Certificates cost $300+/year).

---

### 🪟 Windows Defender False Positive: `Trojan:Win32/Wacatac.C!ml`

> [!NOTE]
> **What does `!ml` mean?**
> The `!ml` tag stands for **Machine Learning Heuristics**. Microsoft Windows Defender automatically flags newly generated, unsigned Electron `.exe` binaries because Electron packages a Node.js runtime and V8 JavaScript engine into a single executable. Because Windows Defender's AI model has not seen this specific file hash before, it flags it as a generic `Wacatac.C!ml` heuristic false positive.

#### How to bypass Windows SmartScreen & Defender:

1. **SmartScreen Banner**:
   - On the blue prompt *"Windows protected your PC"*, click **More info**.
   - Click the **Run anyway** button at the bottom.

2. **If Windows Defender Blocks the Download**:
   - Open **Windows Security** > **Virus & threat protection**.
   - Click **Protection history**.
   - Find the entry for Habbify, click **Actions**, and select **Allow on device** or **Restore**.
   - *Optional*: You can submit the file directly to [Microsoft Security Intelligence Sample Submission](https://www.microsoft.com/wdsi/filesubmission) to accelerate false-positive clearing.

---

### 🍎 macOS Gatekeeper: "Unidentified Developer / Cannot Be Opened"

Apple Gatekeeper blocks apps downloaded from outside the Mac App Store that are not signed with a paid Apple Developer Certificate.

#### **Method 1: Right-Click Open (Fastest — 2 Seconds)**
1. Open your Downloads folder and find `Habbify.app` or `Habbify-Installer.dmg`.
2. **Right-click** (or hold `Control` and click) the Habbify icon.
3. Click **Open** from the dropdown menu.
4. In the pop-up modal, click **Open**. (macOS remembers this decision permanently).

#### **Method 2: System Settings**
1. Open **System Settings** > **Privacy & Security**.
2. Scroll down to **Security**.
3. Under *"Habbify was blocked from use because it is not from an identified developer"*, click **Open Anyway**.

#### **Method 3: Terminal Command**
If you prefer command line:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Habbify.app
```

---

## 🛠️ Building & Running From Source

If you want to inspect the source code or build the binaries yourself:

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
