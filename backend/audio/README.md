# Soundcheck Audio

Place your FLAC file here, named exactly:

    soundcheck.flac

The FastAPI backend serves this directory at `/audio/soundcheck.flac`.
The file is streamed to the browser with full Range-request support,
so large files work without buffering the whole file first.

## Recommended file
- Format : FLAC (lossless)
- Sample rate : 44.1 kHz or 48 kHz
- Channels : Stereo (2-channel)
- Duration : 1–5 minutes is ideal for a soundcheck sweep

Once the file is in place, restart the backend and the
"RUN SOUNDCHECK" button will activate automatically.
