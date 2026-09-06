#!/bin/bash
# ── The nine hint lines, as files ────────────────────────────────────────────
#
# Message 72, step 3: Web Speech will always sound like Web Speech. The hints
# are a fixed set of nine lines, so they are recorded once and played instead
# of synthesised (src/utils/voice.js plays public/voice/<id>.mp3 when it
# exists, and falls back to synthesis when it does not).
#
# This renders them on a Mac with the best voice installed there. It cannot
# run in the cloud workspace (no speech engine, and the neural TTS services
# are unreachable from it), which is why the files are not in this commit.
#
#   cd packages/gamified-elearning && bash scripts/render-hints.sh
#
# Best result: install an enhanced voice first (System Settings > Accessibility
# > Spoken Content > System Voice > Manage Voices, download "Samantha
# (Enhanced)" or "Ava (Premium)"), then pass its name:
#
#   VOICE="Ava (Premium)" bash scripts/render-hints.sh
#
# A human reading nine lines is better still. Record them as 44.1 kHz mono,
# trim the silence, export as MP3 at 64 kbps, and drop them in public/voice/
# under the same names. Nothing in the code changes.

set -euo pipefail
cd "$(dirname "$0")/.."
VOICE="${VOICE:-Samantha}"
OUT="public/voice"
mkdir -p "$OUT"

if ! command -v say >/dev/null 2>&1; then
  echo "This needs macOS (the say command). Run it on the Mac."; exit 1
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is needed to make MP3s: brew install ffmpeg"; exit 1
fi

render () {
  local id="$1" line="$2"
  say -v "$VOICE" -r 175 -o "/tmp/$id.aiff" "$line"
  ffmpeg -y -loglevel error -i "/tmp/$id.aiff" -ac 1 -ar 44100 -b:a 64k \
    -af "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_silence=0.15:start_threshold=-45dB,areverse" \
    "$OUT/$id.mp3"
  rm -f "/tmp/$id.aiff"
  echo "  $OUT/$id.mp3"
}

echo "Rendering nine lines with the voice \"$VOICE\":"
render hint-concept   "Read through this step. Press Got It when you are ready."
render hint-example   "Press Run to see the example code in action."
render hint-tryit     "Try writing the code yourself, then press Run."
render hint-challenge "This is your challenge. Give it your best try!"
render hint-predict   "Read the code and tap the answer you think is right."
render hint-fillblank "Tap a word below to drop it into a yellow gap."
render hint-order     "Use the arrows to move each line up or down."
render hint-correct   "Correct! Press Next Step to keep going."
render hint-complete  "Lesson complete! Press Continue to Quiz when you are ready."
echo "Done. Commit public/voice/ and the site plays these instead of synthesising."
