"""Check that full- and limited-range inputs keep the same visible colour."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
FF = os.environ.get("FFMPEG", "ffmpeg")
PROBE = os.environ.get("FFPROBE", "ffprobe")


def run(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE)


with tempfile.TemporaryDirectory(prefix="film-lab-delivery-") as directory:
    root = Path(directory)
    colours = []
    for colour_range, pixel_format in [("pc", "yuvj420p"), ("tv", "yuv420p")]:
        source, final = root / f"{colour_range}.mp4", root / f"{colour_range}-final.mp4"
        run([FF, "-v", "error", "-f", "lavfi", "-i", "color=c=0xc4d4e4:s=160x90:r=30:d=1",
             "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1",
             "-vf", f"scale=in_range=tv:out_range={colour_range},format={pixel_format}",
             "-c:v", "libx264", "-crf", "10", "-c:a", "aac", "-ac", "2", "-color_range", colour_range,
             "-colorspace", "smpte170m", str(source)])
        run(["bash", str(HERE / "deliver.sh"), str(source), str(final), "10"])
        def rgb(path):
            return run([FF, "-v", "error", "-i", str(path), "-frames:v", "1",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])[:3]
        # Allow six RGB levels for the two lossy 8-bit YUV encodes.
        before, after = rgb(source), rgb(final)
        assert max(abs(a-b) for a, b in zip(before, after)) <= 6, (colour_range, before, after)
        colours.append(after)
        def aac(path):
            return run([FF, "-v", "error", "-i", str(path), "-map", "0:a:0", "-c:a", "copy", "-f", "adts", "-"])
        assert aac(source) == aac(final), 'Delivery encoded the AAC stream a second time'
        info = json.loads(run([PROBE, "-v", "error", "-select_streams", "v:0",
                               "-show_entries", "stream=color_range,color_space,pix_fmt,nb_frames",
                               "-of", "json", str(final)]))["streams"][0]
        assert info == {"pix_fmt": "yuv420p", "color_range": "tv",
                        "color_space": "bt709", "nb_frames": "30"}, info
    assert max(abs(a-b) for a, b in zip(*colours)) <= 3, colours
print("Delivery: RGB changes <=6 levels, input-range variants agree within 3; all 30 frames survive as BT.709 limited.")
