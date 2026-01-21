# Tenshon Tiler 🎵

**Tenshon Tiler** is a professional, web-based soundboard application designed for theater productions, live events, and podcasts. It features a robust audio engine capable of handling rapid-fire sound effects, looping music tracks, and real-time mixing.

## ✨ Features

### 🎛️ Audio Engine & Playback
* **Low Latency Response:** Uses the Web Audio API for instant playback.
* **Polyphonic "Machine Gun" Support:** Spam keys without audio cutting out.
* **Playback Modes:**
    * **One-Shot:** Plays the sound once.
        * *Overlap:* Multiple presses stack sounds on top of each other.
        * *Cut:* Pressing again stops the previous instance (good for voice lines).
    * **Toggle:** Starts and stops the sound (great for looping background music).
* **Fades:** Configurable **Fade In** and **Fade Out** times (0s - 5s) for smooth transitions.
* **Looping:** Toggle any sound to repeat indefinitely.

### 🎨 Customization
* **Custom Images:** Upload images to replace button colors.
* **Color Coding:** Choose from a wide palette of Tailwind colors for organization.
* **Categorization:** Group sounds by Scene, Act, or Type (e.g., "Act 1", "Combat").
* **Keyboard Shortcuts:** Map any key (A-Z, 0-9) to trigger sounds.

### 🎚️ Mixing & Control
* **Real-Time Volume:** Adjust Master Volume or individual Clip Volume while sounds are playing.
* **Panic Button (Stop All):** Instantly silences all audio and fades out active loops. Includes a counter showing how many voices are currently active.
* **Visual Feedback:** Tiles glow and pulse when active.

### 💾 Save & Load
* **Portable Save Files:** Export your entire board configuration (including audio files and images) to a single `.json` file.
* **No Database Required:** Everything runs locally in the browser.

---

## 🚀 How to Use

### 1. Adding Sounds
1.  Click the **+ Add Sound** button.
2.  Upload an audio file (MP3, WAV, etc.).
3.  Give it a name and assign a color or image.
4.  Set a **Keyboard Shortcut** for quick access.

### 2. Edit Mode
Click the **Gear Icon ⚙️** in the top right to toggle **Edit Mode**.
* **Hover** over any tile to see the Edit menu.
* **Click** the edit button to change volume, fades, or playback modes.
* **Delete** sounds you no longer need.

### 3. Playback Modes Explained
* **Zap Icon (One-Shot):** Best for SFX (punches, gunshots, hits).
    * *Overlap:* Sounds stack.
    * *Cut:* New press silences the old one.
* **Power Icon (Toggle):** Best for Music/Ambience. Press once to start, press again to stop (with fade out if configured).

### 4. Saving Your Board
* Click **Export** in the header to download your `soundboard_save.json`.
* Click **Import** to load a previous configuration.
* *Note: Large audio files make the save file larger. This is normal.*

---


## 🔧 Technologies Used
* **React** (Vite)
* **Tailwind CSS** (Styling)
* **Lucide React** (Icons)
* **Web Audio API** (Audio Engine)

---

**Created by CircleSide**