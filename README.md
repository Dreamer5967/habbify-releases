# Habbify 🚀 (v1.0.0)

> **The Ultimate All-in-One Gamified Habit, Fitness, Finance & Productivity Suite**

Habbify is a state-of-the-art desktop & web application designed to track habits, gym workouts, daily routines, focus sessions, personal goals, and finances — all integrated with a gamified level & XP system, social leaderboards, and customizable themes.

---

## 🌟 Key Features

### 1. 🎯 Habit Tracker
- **Smart Tracking**: Log daily, weekly, or custom habit frequencies.
- **Contribution Heatmap**: GitHub-style activity heatmaps to visualize your consistency over 52 weeks.
- **Streak & XP Rewards**: Earn XP for every completed habit and level up your profile.

### 2. 🏋️ Gym Planner & Muscle Map
- **Anatomical Muscle Diagram**: Visual muscle group map with precise color indexing (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads/Legs, Hamstrings, Glutes, Calves, Core).
- **60+ Exercise Library**: Pre-built library of exercises filtered by muscle group and equipment.
- **Personal Records (PR) Tracking**: Automatically tracks max weight PRs for Bench Press, Squats, Deadlifts, and more.
- **Custom Workout Splits**: Build Push/Pull/Legs or custom multi-day gym routines.

### 3. 🧠 Focus Timer (Pomodoro)
- Customizable focus and break intervals.
- Circular SVG progress visualizer with session counts and automated XP rewards upon completion.

### 4. 💰 Finance Tracker
- Log income and expenses with automatic net balance tracking.
- Interactive category breakdown charts (Recharts) and multi-currency support.

### 5. 🏆 Goal & Routine Trackers
- Track short-term and long-term goals with spreadsheet check-ins and progress metrics.
- Build morning/evening routine streaks.

### 6. 👥 Social & Global Leaderboard
- Real-time global & friends XP leaderboards (powered by Firebase).
- Share habit milestones, add friends, and chat in real-time.

### 🎨 25+ Themes (Including Strawberry 🍓)
- Includes Dark, Light, Dashboard, **Strawberry 🍓**, Ocean, Forest, Sunset, Midnight, Matcha, Arcane, Tsunami, Meteor Shower, and a custom CSS variable theme builder.

---

## 📥 Downloading & Installation

You can download pre-built installers for **macOS** and **Windows** from the [Releases](https://github.com/Dreamer5967/habbify-releases/releases) tab.

---

## 🛡️ Bypassing Security Warnings ("Unknown Publisher / Unsafe App")

Because Habbify is an open-source project built without expensive commercial code-signing certificates (Apple Developer Program $99/yr & Windows EV Certificate $300/yr), your operating system may display a security prompt on first launch. **Habbify is 100% safe, open-source, and contains zero malware.**

Follow the quick steps below to open the application:

### 🍎 macOS ("Unidentified Developer" / "App Cannot Be Opened")

If macOS displays: *"Habbify cannot be opened because it is from an unidentified developer"*

#### **Method 1: Right-Click Open (Recommended - Takes 2 Seconds)**
1. Locate `Habbify.app` or `Habbify-Installer.dmg` in your Downloads folder.
2. **Right-Click** (or hold `Control` and click) the app icon.
3. Click **Open** from the context menu.
4. In the pop-up dialog, click **Open**. (macOS will remember this choice permanently).

#### **Method 2: System Settings**
1. Open **System Settings** on your Mac.
2. Go to **Privacy & Security** in the sidebar.
3. Scroll down to the **Security** section.
4. You will see a note: *"Habbify was blocked from use because it is not from an identified developer"*.
5. Click **Open Anyway** and enter your Mac password.

#### **Method 3: Terminal Command**
Open Terminal and run:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Habbify.app
```

---

### 🪟 Windows ("Windows Protected Your PC / Unknown Publisher")

If Windows Defender SmartScreen displays: *"Windows protected your PC - Microsoft Defender SmartScreen prevented an unrecognized app from starting"*

1. Click **More info** (underlined text on the blue SmartScreen banner).
2. A new button will appear at the bottom: **Run anyway**.
3. Click **Run anyway** to launch Habbify.

---

## 💻 Building & Running from Source

If you prefer to build Habbify yourself from source:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (v9 or higher)

### Setup Instructions
```bash
# Clone the repository
git clone https://github.com/Dreamer5967/habbify-releases.git
cd habbify-releases

# Install dependencies
npm install

# Run in development mode (Vite + Electron)
npm run electron:dev

# Build local production bundle
npm run build

# Build macOS Universal installer (.dmg & .app)
npm run electron:build

# Build Windows installer (.exe)
npm run electron:build:win
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more details.
