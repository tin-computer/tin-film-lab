import importlib.util
from pathlib import Path
import unittest
import tempfile
import wave
import json
from array import array
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('sound_review',Path(__file__).with_name('build.py'))
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
class Choices(unittest.TestCase):
 def test_silence_missing_and_exact_context(self):
  notes={'press':{'effect':'click','listener':'Hamit','reason':'Small, physical press'},'complete':{'effect':None}}
  self.assertEqual(build.selected_effect(notes,'press',{'click'})['effect'],'click')
  self.assertIsNone(build.selected_effect(notes,'complete',{'click'}))
  self.assertIsNone(build.selected_effect(notes,'message',{'click'}))
  with self.assertRaises(ValueError):build.selected_effect(notes,'press',set())
 def test_stereo_preview_keeps_peak_limit_and_measured_anchor(self):
  ffmpeg=Path(__file__).resolve().parents[2]/'bin/ffmpeg'
  if not ffmpeg.exists():self.skipTest('Install the existing ffmpeg dependency')
  with tempfile.TemporaryDirectory() as directory:
   source=Path(directory)/'stereo.wav';output=Path(directory)/'preview.wav'
   samples=array('h',[0]*(4800*2));samples[1440*2]=31000;samples[1440*2+1]=-29000
   if build.sys.byteorder!='little':samples.byteswap()
   with wave.open(str(source),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(48000);f.writeframes(samples.tobytes())
   measured=build.normalize(str(ffmpeg),source,output)
   with wave.open(str(output)) as f:
    result=array('h',f.readframes(f.getnframes()))
    if build.sys.byteorder!='little':result.byteswap()
   self.assertLessEqual(max(abs(value) for value in result),22940)
   self.assertAlmostEqual(measured['anchor'],.83,places=5)
 def test_catalogue_build_keeps_sources_and_expands_each_action(self):
  ids=['click-001','click-003','select-001','confirmation-001','confirmation-002','pluck-001','tick-001','open-001','switch-001','close-001']
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);index=root/'index.json';catalogue=root/'catalogue.json';out=root/'out'
   rows=[{'id':'kenney-'+key,'audio':'source.wav','source':{'provider':'fixture'}} for key in ids]
   index.write_text(json.dumps(rows));original=index.read_bytes()
   families=['click','select','toggle','tick','confirmation','glass','pluck','bong','drop','open','close','switch','maximize','minimize']
   catalogue.write_text(json.dumps([{'kind':'effect','id':f'S-fixture_{family}_{i}','family':family,'source_file':'extra.wav','source':{'provider':'fixture'},'title':'</script> fixture'} for family in families for i in range(4)]))
   def normalize(ffmpeg,source,output):
    self.assertTrue(source.is_absolute());output.write_bytes(b'fixture');return {'anchor':.8,'gain':1}
   with patch.object(build,'normalize',side_effect=normalize):
    result=build.build(index,out,'unused',catalogue=catalogue,asset_root=root)
   self.assertEqual(result['human_choices'],0);self.assertEqual(result['contexts'],4)
   page=(out/'index.html').read_text();payload=next(line for line in page.splitlines() if line.startswith('const DATA = '))
   data=json.loads(payload.removeprefix('const DATA = ').removesuffix(';'))
   self.assertTrue(all(len(group)==12 and len(set(group))==12 for group in data['groups'].values()))
   self.assertGreater(len(data['assets']),10)
   self.assertNotIn('</script>',payload)
   self.assertEqual(index.read_bytes(),original)
   self.assertTrue(all((out/value['file']).is_file() for value in data['assets'].values()))
 def test_external_catalogue_requires_source_root(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);index=root/'index.json';index.write_text('[]')
   with self.assertRaisesRegex(ValueError,'asset-root'):
    build.build(index,root/'out','unused',catalogue=root/'catalogue.json')
if __name__=='__main__':unittest.main()
