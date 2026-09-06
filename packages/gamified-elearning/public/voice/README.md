# The Read to me recordings

`src/utils/voice.js` plays `hint-<id>.mp3` from this folder for each of the
nine lesson hint lines, and falls back to the browser's speech synthesis when
a file is missing. Render them with `scripts/render-hints.sh` on a Mac, or
record a person reading them and save under the same names.
