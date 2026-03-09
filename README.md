# Text Mixer

A React Native (Expo) app that takes two pieces of text and "mixes" them using Claude AI. Supports **Style Transfer** and **Mashup** modes with a handwriting-style mixing animation and voice input via ElevenLabs STT.

## Setup

### Prerequisites

- Node.js 18+
- JDK 17+ (required for Android builds)
- Android SDK (via Android Studio) or Xcode (for iOS)
- An Expo account (`npx expo login`)

### Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_claude_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Install & Run

```bash
npm install
npx expo prebuild          # Generate native projects (required — Expo Go is not supported)
npx expo run:android       # Build and run on Android device/emulator
npx expo run:ios           # Build and run on iOS simulator/device
```



## Project Structure

```
app/
  _layout.tsx       # Root layout (stack navigator)
  index.tsx         # Capture screen — text input, voice input, mode selector
  mixing.tsx        # Mixing animation screen (Skia)
  result.tsx        # Result reveal with typewriter effect
services/
  claude.ts         # Claude API integration (mixTexts)
  elevenlabs-stt.ts # ElevenLabs speech-to-text
hooks/
  useVoiceInput.ts  # Voice recording + transcription hook
assets/
  fonts/Caveat-Regular.ttf  # Handwriting font used in mixing animation
```

## Approach & Tradeoffs

### Mixing Animation (Skia masking)

The mixing screen animates words from both input texts in a cycling loop while the Claude API call runs in the background.

**Approach chosen:** `@shopify/react-native-skia` with a **rect-mask reveal**. A `<Mask>` wraps the Skia `<Text>` element, and a `<Rect>` inside the mask animates its width from 0 to full — creating a left-to-right handwriting reveal effect. A second Skia `<Path>` draws a red strikethrough with an animated `end` property. Ink drop effects remain as standard `Animated.View` elements.

**Why Skia over the previous SVG approach:**
- **No font parsing at runtime** — the previous approach used `opentype.js` to convert text into SVG path data, which required downloading the font file, base64-decoding it, and computing path lengths. Skia's `useFont` handles this natively.
- **No fallback component needed** — the SVG approach could fail (invalid paths, zero-length estimates), requiring a separate `FallbackWord` component. The Skia approach always works if the font loads.
- **GPU-accelerated** — Skia renders on the GPU. The SVG `strokeDashoffset` approach ran on the JS/UI thread bridge.
- **Simpler code** — went from 3 animation components (~270 lines) + a 127-line `textToPath` service to 1 component (~120 lines).

**Tradeoff:** Skia requires a **dev build** (native compilation). The app no longer works in Expo Go. This was already the direction of the project (voice input requires native modules too).

### Animation Timeline (per word, ~3.7s)

| Phase | Time | Effect |
|-------|------|--------|
| Reveal | 0 - 2000ms | Text appears left-to-right via mask |
| Ink drops | 1800 - 2200ms | 3 dots spring in (staggered) |
| Strikethrough | 2600 - 3100ms | Red line draws across |
| Fade out | 3300 - 3700ms | Container fades, next word begins |

### Long words

If a word's measured width exceeds 280px, the font size is scaled down proportionally to fit the canvas. This is computed once via `useMemo`.

## What Was Cut

| Removed | Reason |
|---------|--------|
| `services/textToPath.ts` | Only existed to parse fonts with opentype.js for SVG paths — fully replaced by Skia's `useFont` |
| `opentype.js` + `@types/opentype.js` | No longer needed without textToPath |
| `FallbackWord` component | Skia approach doesn't fail in the ways that required a fallback |
| `HandwrittenWord` component | Replaced by `SkiaWord` |
| `WordAnimation` component | Was a router between Handwritten/Fallback — no longer needed |
| `AnimatedPath` (animated SVG) | Replaced by Skia `<Path>` with `end` prop |
| `react-native-svg` import in mixing.tsx | No longer used in this screen (still in package.json for potential use elsewhere) |
