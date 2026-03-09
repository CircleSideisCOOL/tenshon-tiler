# Tenshon Tiler 🎵

**Tenshon Tiler** is a professional, web-based soundboard application designed for theater productions, live events, and podcasts. It features a robust audio engine capable of handling rapid-fire sound effects, looping music tracks, and real-time mixing.

**Current Version: `1.6.0`**

---

## ✨ Features

### 🎛️ Audio Engine & Playback
* **Low Latency Response:** Uses the Web Audio API for instant playback.
* **Polyphonic "Machine Gun" Support:** Spam keys without audio cutting out.
* **Playback Modes:**
    * **One-Shot:** Plays the sound once.
        * *Overlap:* Multiple presses stack sounds on top of each other.
        * *Cut:* Pressing again stops the previous instance (good for voice lines).
    * **Toggle:** Starts and stops the sound (great for looping background music).
        * *Pausable:* Pause and resume from where it left off.
        * *Restart:* Always starts from the beginning when toggled ON.
* **Looping:** Toggle any sound to repeat indefinitely.

### 🔊 Advanced Audio Controls
* **Clip Volume Boost (0% - 200%):** Boost individual clip volume beyond 100% with a precision slider and snap-to-100% for accuracy.
* **Configurable Fades:**
    * **Fade In (Start):** Smooth volume ramp when playback begins (0s – 5s).
    * **Fade Out (End):** Automatic volume ramp-down as the clip nears its end, with a live countdown timer on the tile.
    * **Resume Fade:** Custom fade when resuming a paused toggle sound.
    * **Pause Fade:** Custom fade when pausing a toggle sound.
* **Custom Fade Curves:** Choose from **Linear**, **Exponential**, **Logarithmic**, or **S-Curve** ramp shapes.
* **Waveform Visualizer:** Real-time waveform display of the audio file with overlaid fade-in/out ramps, pause/resume indicators, and total clip duration.

### 🎨 Customization
* **Custom Images:** Upload images to replace button colors.
* **Custom Colors:** Use a color picker to set any hex color for tiles beyond the preset palette.
* **Color Presets:** Choose from 15+ curated Tailwind color presets for quick organization.
* **Notes:** Add rich notes to any sound tile for cues and reminders.
* **Categorization:** Group sounds by Scene, Act, or Type (e.g., "Act 1", "Combat").
* **Category Management:** Create, reorder, and organize custom categories.
* **Folder Nesting:** Nest sounds inside folder tiles for hierarchical organization.
* **Keyboard Shortcuts:** Map any key (A-Z, 0-9) to trigger sounds.

### 🎚️ Mixing & Control
* **Master Volume:** Global volume control for all audio.
* **Clip Volume:** Per-sound volume control with 200% boost capability.
* **Panic Button (Stop All):** Instantly silences all audio and fades out active loops. Includes a counter showing how many voices are currently active.
* **Global Pause/Resume:** Pause and resume all active sounds at once with per-sound fade customization.
* **Visual Feedback:** Tiles glow and pulse when active, with live fade timers showing "FADE IN", "FADE OUT", "PAUSING", and "RESUMING" countdowns.

### 💾 Save & Load
* **IndexedDB Persistence:** Your board auto-saves locally in the browser — no manual saving needed.
* **Portable Save Files:** Export your entire board configuration (including audio files and images) to a single `.json` file.
* **Import:** Load a previous configuration from a `.json` file.
* **No Database Required:** Everything runs locally in the browser.

### 📖 Interactive Tutorial
* **Built-in Tutorial:** A guided, interactive tutorial teaches new users the interface with live demo tiles, live experiments, and step-by-step instructions.

### 🖱️ Drag & Drop
* **Reorder Tiles:** Drag and drop sound tiles to rearrange them in Edit Mode.
* **Touch Support:** Full touch/mobile support for drag-and-drop interactions.

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
* **Drag** tiles to rearrange them.

### 3. Playback Modes Explained
* **Zap Icon (One-Shot):** Best for SFX (punches, gunshots, hits).
    * *Overlap:* Sounds stack.
    * *Cut:* New press silences the old one.
* **Power Icon (Toggle):** Best for Music/Ambience. Press once to start, press again to stop.
    * *Pausable:* Remembers position — resume where you left off.
    * *Restart:* Always replays from the beginning.

### 4. Advanced Audio (Edit Modal)
* Switch to the **Advanced Audio** tab in the edit modal.
* Adjust **Fade In**, **Fade Out**, **Resume Fade**, and **Pause Fade** durations.
* Select a **Fade Curve** to control the shape of the volume ramp.
* View the **Waveform Visualizer** to see how your fades overlay the audio file.
* Boost **Clip Volume** up to 200% for quiet files.

### 5. Saving Your Board
* Your board **auto-saves** to the browser's IndexedDB — just keep using it.
* Click **Export** in the header to download your `soundboard_save.json` for backup or sharing.
* Click **Import** to load a previous configuration.
* *Note: Large audio files make the save file larger. This is normal.*

---

## 🔧 Technologies Used
* **React** (Vite)
* **Tailwind CSS** (Styling)
* **Lucide React** (Icons)
* **Web Audio API** (Audio Engine)
* **@dnd-kit** (Drag & Drop)
* **IndexedDB** (Local Persistence)
* **PWA** (Installable as a Progressive Web App)

---

## 📋 Changelog

### v1.6.0
* 🎨 **Waveform Visualizer** — Real-time audio waveform display with fade curve overlays
* 🔊 **Volume Boost** up to 200% with snap-to-100% precision slider
* 📉 **Custom Fade Curves** — Linear, Exponential, Logarithmic, S-Curve
* ⏱️ **End-of-Track Fade Out Timer** — Visual countdown on tiles as audio nears the end
* 🎨 **Custom Color Picker** — Set any hex color for tiles
* 🐛 Fixed browser crash when volume exceeded 100% on HTML audio elements

### v1.5.0
* 🎛️ Independent Pause/Resume fades per sound
* 📂 Folder nesting for tile organization
* 📖 Interactive tutorial with live experiments
* 🔀 Drag-and-drop tile reordering

---

**Created by CircleSide**
