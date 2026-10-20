"""Check that the imported gates accept a good mux and reject a real offset/spec error."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
FF = os.environ.get('FFMPEG', 'ffmpeg')


def run(args, expected=0):
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode != expected:
        raise AssertionError(f'Expected {expected}, got {p.returncode}: {args}\n{p.stderr}\n{p.stdout}')
    return p


with tempfile.TemporaryDirectory(prefix='film-lab-cinetic-') as folder:
    d = Path(folder)
    signal = np.random.default_rng(17).normal(0, 0.025, 48000 * 4)
    sf.write(d / 'source.wav', np.column_stack([signal, signal]), 48000)
    run([FF, '-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=60:d=4',
         '-i', str(d / 'source.wav'), '-vf', 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
         '-ar', '48000', '-ac', '2', '-colorspace', 'bt709', '-color_primaries', 'bt709',
         '-color_trc', 'bt709', '-color_range', 'tv', '-shortest', str(d / 'good.mp4')])
    run([sys.executable, str(HERE / 'probe.py'), str(d / 'good.mp4'), '--spec', '320x180@60', '--dur', '4'])
    run([sys.executable, str(HERE / 'probe.py'), str(d / 'good.mp4'), '--spec', '320x180@30'], expected=1)
    run([sys.executable, str(HERE / 'check-sync.py'), str(d / 'good.mp4'), str(d / 'source.wav')])
    run([FF, '-v', 'error', '-i', str(d / 'good.mp4'), '-af', 'adelay=80|80', '-c:v', 'copy',
         '-c:a', 'aac', '-t', '4', str(d / 'late.mp4')])
    bad = run([sys.executable, str(HERE / 'check-sync.py'), str(d / 'late.mp4'), str(d / 'source.wav')], expected=1)
    assert json.loads(bad.stdout)['sync_ok'] is False
    mixer = HERE.parents[1] / 'films/tin-launch/tools/mix.sh'
    run(['bash', str(mixer), str(d / 'good.mp4'), str(d / 'source.wav'), str(d / 'default.mp4')])
    run(['bash', str(mixer), str(d / 'good.mp4'), str(d / 'source.wav'), str(d / 'reference.mp4'), '', str(d / 'mix.wav')])
    run([sys.executable, str(HERE / 'check-sync.py'), str(d / 'reference.mp4'), str(d / 'mix.wav')])
    assert sf.info(d / 'mix.wav').frames == 48000 * 4
    selector = [sys.executable, str(HERE / 'pick.py'), '--format', 'launch', '--energy', 'medium',
                '--seconds', '22', '--seed', '20261020', '--brand-supplied', 'orange,beige']
    first, again, different = (d / name for name in ['picks.json', 'again.json', 'different.json'])
    for path in [first, again]:
        run([*selector, '--json', str(path)])
    assert first.read_bytes() == again.read_bytes()
    run([*selector, '--avoid', str(first), '--json', str(different)])
    ids = lambda path: {p['id'] for p in json.loads(path.read_text())['picks']}
    assert not ids(first) & ids(different)
print('Cinetic gates: good mux passed; wrong frame rate and 80 ms delay rejected; old mixer call and reference-WAV output passed')
