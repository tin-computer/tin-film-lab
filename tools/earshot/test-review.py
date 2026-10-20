"""Check failure reporting without downloading or loading audio models."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

review = Path(__file__).with_name("review.py")
with tempfile.TemporaryDirectory() as folder:
    d = Path(folder)
    missing = subprocess.run([sys.executable, str(review), str(d / "missing.mp4"), str(d / "missing-report")], capture_output=True)
    assert missing.returncode == 2 and not (d / "missing-report").exists()
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=c=white:s=160x90:r=30:d=1",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(d / "silent.mp4")], check=True)
    silent = subprocess.run([sys.executable, str(review), str(d / "silent.mp4"), str(d / "silent-report")], capture_output=True)
    assert silent.returncode != 0
    report = json.loads((d / "silent-report/review.json").read_text())
    assert report["status"] == "incomplete" and report["failed_stage"] == "measure"
    assert "no audio" in report["error"].lower() and not report["human_listening"]
    # Stub only the expensive API to check a source being replaced during a review.
    fake = d / "fake/earshot"
    fake.mkdir(parents=True)
    (fake / "__init__.py").write_text("""from pathlib import Path
from types import SimpleNamespace
__version__ = 'test'
def measure(path, **kwargs):
    p = Path(path); p.write_bytes(p.read_bytes() + b'changed'); return {}
api = SimpleNamespace(measure=measure, timeline=lambda *a, **k: {'text': 'test'}, sheet=lambda *a, **k: {}, critique=lambda *a, **k: {})
""")
    (fake / "report.py").write_text("from json import dumps as to_json\n")
    changed = d / "changed.mp4"
    changed.write_bytes(b'test source')
    run = subprocess.run([sys.executable, str(review), str(changed), str(d / "changed-report")],
                         env={**os.environ, "PYTHONPATH": str(d / "fake")}, capture_output=True)
    report = json.loads((d / "changed-report/review.json").read_text())
    assert run.returncode != 0 and report["status"] == "incomplete"
    assert "Source changed" in report["error"]
print("Review errors: missing, silent and changed files cannot receive a complete result")
