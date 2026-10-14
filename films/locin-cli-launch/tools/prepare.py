"""Restore this film's music with the lab's existing downloader and cut tool."""
import json
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg

FILM = Path(__file__).resolve().parents[1]
ROOT = FILM.parents[1]
sys.path.insert(0, str(ROOT / "music"))
from fetch_audio import download


def main():
    ffmpeg = ROOT / "bin" / "ffmpeg"
    ffmpeg.parent.mkdir(exist_ok=True)
    if not ffmpeg.exists():
        ffmpeg.symlink_to(imageio_ffmpeg.get_ffmpeg_exe())

    manifest = json.loads((ROOT / "music" / "audio-manifest.json").read_text())
    state = download(
        "https://assets.mixkit.co/music/1140/1140.mp3",
        ROOT / "music" / "catalogue" / "mp3" / "1140.mp3",
        manifest["music/1140"],
    )
    print(f"Funkee Monkeee: {state}; source checksum checked", flush=True)
    subprocess.run([
        sys.executable, str(ROOT / "music" / "tools" / "cut.py"),
        str(ROOT / "music" / "library" / "1140-funkee-monkeee"),
        str(FILM / "music-cut"), "--bars", "10", "--land", "drop",
        "--at", "4", "--fade-bars", "1",
    ], check=True)


if __name__ == "__main__":
    main()
