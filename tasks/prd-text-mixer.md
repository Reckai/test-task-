# PRD: Text Mixer App

## Introduction

A React Native (Expo) app that takes two text inputs from the user, sends them to Claude AI to creatively "mix" them, and presents the result with polished animations and transitions. The app supports two mixing modes (Style Transfer and Mashup) with a mode selector, ElevenLabs voice input (STT) and result playback (TTS), haptic feedback, and a sound effect on reveal. Think of it as a creative blender for words.

## Goals

- Deliver a 4-screen linear flow: Capture Text 1 → Capture Text 2 → Mixing → Result
- Provide two selectable mixing modes (Style Transfer, Mashup)
- Integrate Claude API for the mix operation
- Integrate ElevenLabs API for Speech-to-Text (voice input) and Text-to-Speech (listen to result)
- Create polished Reanimated-driven animations and screen transitions that feel intentional
- Include haptic feedback on mix start/complete and a sound effect on result reveal
- Keep the visual design clean and simple — focus on motion craft, not visual polish

## User Stories

### US-001: Capture Text 1
**Description:** As a user, I want to type or dictate my first piece of text so that it can be used as input for mixing.

**Acceptance Criteria:**
- [ ] Screen displays "Text 1" header
- [ ] Multiline text input field with keyboard support
- [ ] Microphone button triggers ElevenLabs STT recording; transcribed text populates the input field
- [ ] "Continue" button is disabled until text is non-empty
- [ ] When user taps "Continue", the text visually animates into a compact pill/badge (feels "saved") before navigating to Screen 2
- [ ] Typecheck passes

### US-002: Capture Text 2 with Text 1 Preview
**Description:** As a user, I want to enter my second text while seeing my first text is already captured, so I have continuity.

**Acceptance Criteria:**
- [ ] Screen displays "Text 2" header
- [ ] Text 1 appears as an animated pill/badge at the top of the screen (shrink-in transition from Screen 1)
- [ ] Same input pattern as Screen 1 (text field + mic button for STT)
- [ ] Mode selector toggle between "Style Transfer" and "Mashup" visible on this screen
- [ ] "Mix them" button is disabled until text is non-empty
- [ ] Tapping "Mix them" navigates to Screen 3
- [ ] Typecheck passes

### US-003: Mixing Animation Screen
**Description:** As a user, I want to see an engaging animation while the AI processes my texts, so it feels like something magical is happening.

**Acceptance Criteria:**
- [ ] Both texts shown as visual elements (pills/orbs) that animate into a mixing zone
- [ ] At least one Reanimated-driven animation: orbiting, merging, or colliding effect
- [ ] Indeterminate progress indicator present
- [ ] Optional: gradient glow effects using expo-linear-gradient, particle-like elements
- [ ] Haptic feedback fires when mixing starts (medium impact)
- [ ] Haptic feedback fires when mixing completes (success notification)
- [ ] Claude API is called with selected mixing mode prompt
- [ ] On API completion, mixing animation "resolves" (settles/explodes) and transitions to Screen 4
- [ ] Error state: if API fails, show error message with "Try Again" button
- [ ] Typecheck passes

### US-004: Result Reveal Screen
**Description:** As a user, I want to see the mixed result presented with a satisfying reveal animation and have the option to listen to it.

**Acceptance Criteria:**
- [ ] Result text animates in with a typewriter effect or fade-in
- [ ] Sound effect plays on reveal
- [ ] Label shows mixing mode used (e.g., "Style Transfer" or "Mashup")
- [ ] "Listen" button triggers ElevenLabs TTS; audio plays the result aloud
- [ ] "Mix Again" button resets state and navigates back to Screen 1
- [ ] Typecheck passes

### US-005: Claude API Integration
**Description:** As a developer, I need to integrate the Claude API to perform the text mixing operation.

**Acceptance Criteria:**
- [ ] API key read from `.env` file (`ANTHROPIC_API_KEY`)
- [ ] Style Transfer prompt: "Rewrite Text 1 in the style of Text 2"
- [ ] Mashup prompt: "Creatively combine these two texts into one"
- [ ] Proper error handling: timeout, network failure, invalid response
- [ ] Response parsed and passed to result screen
- [ ] Typecheck passes

### US-006: ElevenLabs STT Integration (Voice Input)
**Description:** As a user, I want to record my voice and have it transcribed to text, so I can input text hands-free.

**Acceptance Criteria:**
- [ ] Microphone button on both text capture screens
- [ ] Tapping mic starts recording via expo-av; visual indicator shows recording in progress
- [ ] Tapping again (or auto-stop) ends recording, sends audio to ElevenLabs STT API
- [ ] Transcribed text populates the input field
- [ ] API key read from `.env` file (`ELEVENLABS_API_KEY`)
- [ ] Error handling: permission denied, API failure, empty transcription
- [ ] Typecheck passes

### US-007: ElevenLabs TTS Integration (Listen to Result)
**Description:** As a user, I want to listen to the mixed result read aloud so I can experience it auditorily.

**Acceptance Criteria:**
- [ ] "Listen" button on result screen
- [ ] Tapping sends result text to ElevenLabs TTS API
- [ ] Audio streams/plays back via expo-av
- [ ] Loading state while TTS is generating
- [ ] Button toggles to stop if audio is playing
- [ ] Error handling for API failure
- [ ] Typecheck passes

### US-008: Navigation & Screen Transitions
**Description:** As a developer, I need to set up expo-router with custom transitions between all 4 screens.

**Acceptance Criteria:**
- [ ] File-based routing with expo-router: 4 screen files
- [ ] Linear flow only — no back navigation (forward + "Mix Again" reset)
- [ ] Custom shared element transition: text pill animates from Screen 1 → Screen 2
- [ ] Smooth transition from Screen 2 → Screen 3 (texts fly into mixing zone)
- [ ] Resolve transition from Screen 3 → Screen 4
- [ ] Typecheck passes

### US-009: App Configuration & Environment Setup
**Description:** As a developer, I need proper project configuration for expo-router, reanimated, and environment variables.

**Acceptance Criteria:**
- [ ] `app.json` / `app.config.js` configured for expo-router scheme
- [ ] Babel config includes `react-native-reanimated/plugin`
- [ ] `.env` file with `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` placeholders
- [ ] `.env` added to `.gitignore`
- [ ] Entry point set up for expo-router
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The app has 4 screens in a linear flow: Text 1 → Text 2 → Mixing → Result
- FR-2: Each text capture screen has a multiline text input and a microphone button for ElevenLabs STT
- FR-3: Text 1 animates into a compact pill that persists on Screen 2
- FR-4: Screen 2 includes a toggle to select mixing mode: "Style Transfer" or "Mashup"
- FR-5: The mixing screen shows both texts as visual elements with a Reanimated orbiting/merging animation
- FR-6: The mixing screen calls Claude API with the appropriate prompt based on selected mode
- FR-7: Haptic feedback (expo-haptics) fires on mix start and mix complete
- FR-8: The result screen reveals the mixed text with a typewriter/fade-in animation
- FR-9: A sound effect plays when the result is revealed
- FR-10: A "Listen" button on the result screen sends text to ElevenLabs TTS and plays audio
- FR-11: "Mix Again" button resets all state and returns to Screen 1
- FR-12: API keys are stored in a `.env` file
- FR-13: All API calls have proper error handling with user-facing error states

## Non-Goals

- No user accounts or authentication
- No persistence of previous mixes (no history)
- No more than 2 mixing modes (no Debate or Poetry)
- No back navigation between screens
- No custom visual design system — keep it clean and minimal
- No offline support
- No unit/integration tests (demo scope)

## Design Considerations

- Inspiration: Headspace (smooth, calming transitions), Duolingo (playful, satisfying animations)
- Clean backgrounds, clear typography, well-tuned motion
- Color palette: keep minimal — dark or light background, accent color for interactive elements
- Pills/badges for captured text should feel tactile
- Mixing animation: orbiting orbs with gradient glow is a good starting point
- Result typewriter effect should have satisfying pacing

## Technical Considerations

- **Expo SDK 55** with managed workflow
- **expo-router** for file-based navigation
- **react-native-reanimated v4** for all animations (useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat)
- **expo-haptics** for tactile feedback
- **expo-linear-gradient** for glow/gradient effects on mixing screen
- **expo-av** for sound playback (reveal sound) and audio recording (STT) and TTS playback
- **@anthropic-ai/sdk** for Claude API calls
- **ElevenLabs REST API** via fetch — no SDK needed
- State management: React Context or simple useState lifting (no Redux needed)
- `.env` via `expo-constants` or `react-native-dotenv` for API keys

## Success Metrics

- All 4 screens are functional with working navigation
- Animations are smooth (60fps), well-timed, and feel intentional
- Screen transitions create visual continuity (shared element pill)
- Mixing screen feels engaging, not like a loading screen
- Claude API returns valid mixed text for both modes
- ElevenLabs STT successfully transcribes voice input
- ElevenLabs TTS successfully reads result aloud
- Sound + haptics fire at the right moments
- App runs on iOS and Android via Expo Go

## Open Questions

- What ElevenLabs voice ID to use for TTS? (Default to a neutral voice)
- What sound effect file to use for reveal? (Bundle a short chime/whoosh .mp3)
- Should the mode selector be a toggle switch or segmented control? (Suggest segmented control)
