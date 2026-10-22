"""Build a local listening page. Never invent listener notes or default sound choices."""
import argparse
from array import array
import json
from pathlib import Path
import subprocess
import sys


def selected_effect(notes, context, available):
    choice = notes.get(context)
    if not choice or choice.get('effect') is None:
        return None
    if not choice.get('listener') or not choice.get('reason'):
        raise ValueError('Effect choice needs its listener and context reason')
    if choice['effect'] not in available:
        raise ValueError('Chosen effect is unavailable; do not substitute another sound')
    return choice


def normalize(ffmpeg, source, output):
    pcm = subprocess.check_output([ffmpeg, '-v', 'error', '-i', str(source), '-t', '3', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'])
    samples = array('h', pcm)
    if sys.byteorder != 'little':
        samples.byteswap()
    active = [abs(x) / 32768 for x in samples if abs(x) > 32]
    if not active:
        raise ValueError(f'Silent effect: {source}')
    rms = (sum(x*x for x in active)/len(active))**.5
    gain = min(.1/rms, .7/max(active))
    peak_index = max(range(len(samples)), key=lambda i: abs(samples[i]))
    subprocess.run([ffmpeg, '-y', '-v', 'error', '-i', str(source), '-t', '3', '-af', f'volume={gain},adelay=800:all=1,apad=pad_dur=1', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', str(output)], check=True)
    return {'anchor': .8 + peak_index / 48000, 'gain': gain}


def build(index, out, ffmpeg, music_index=None, music_root=None):
    rows = json.loads(index.read_text())
    by_id = {r['id']: r for r in rows}
    groups = {
        'press': ['kenney-click-001', 'kenney-click-003', 'kenney-select-001'],
        'complete': ['kenney-confirmation-001', 'kenney-confirmation-002', 'kenney-pluck-001'],
        'message': ['kenney-tick-001', 'kenney-select-001', 'kenney-confirmation-001'],
        'transition': ['kenney-open-001', 'kenney-switch-001', 'kenney-close-001'],
    }
    out.mkdir(parents=True, exist_ok=True)
    assets = {}
    for key in sorted({key for ids in groups.values() for key in ids}):
        row = by_id[key]
        source = (index.parent/row['audio']).resolve()
        output = out/f'{key}.wav'
        measured = normalize(ffmpeg, source, output)
        assets[key] = {'file': output.name, **measured, 'source': row['source']}
    music = []
    if music_index:
        if not music_root:
            raise ValueError('--music-index requires --music-root')
        for row in json.loads(music_index.read_text()):
            source = music_root / f"{row['id']}.mp3"
            if not source.exists():
                continue
            target = out / f"music-{row['id']}.mp3"
            import shutil
            shutil.copyfile(source, target)
            music.append({'id':row['id'], 'title':row['title'], 'file':target.name, 'source':row.get('source')})
    template = Path(__file__).with_name('index.html').read_text()
    # Keep source strings inert even when a catalogue contains HTML.
    data = json.dumps({'groups': groups, 'assets': assets, 'music':music}, ensure_ascii=False).replace('<', '\\u003c')
    (out/'index.html').write_text(template.replace('/* DATA */', 'const DATA = '+data+';'))
    (out/'sources.json').write_text(json.dumps(assets, indent=2)+'\n')
    return {'effects': len(assets), 'contexts': len(groups), 'human_choices': 0, 'music': len(music), 'page': str(out/'index.html')}


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--index', type=Path, required=True);p.add_argument('--out', type=Path, required=True)
    p.add_argument('--ffmpeg', default='ffmpeg');p.add_argument('--music-index',type=Path);p.add_argument('--music-root',type=Path);a=p.parse_args()
    print(json.dumps(build(a.index, a.out, a.ffmpeg, a.music_index, a.music_root)))
