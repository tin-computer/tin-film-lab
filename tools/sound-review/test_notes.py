import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('sound_review',Path(__file__).with_name('build.py'))
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
class Choices(unittest.TestCase):
 def test_silence_missing_and_exact_context(self):
  notes={'press':{'effect':'click','listener':'Hamit','reason':'Small, physical press'},'complete':{'effect':None}}
  self.assertEqual(build.selected_effect(notes,'press',{'click'})['effect'],'click')
  self.assertIsNone(build.selected_effect(notes,'complete',{'click'}))
  self.assertIsNone(build.selected_effect(notes,'message',{'click'}))
  with self.assertRaises(ValueError):build.selected_effect(notes,'press',set())
if __name__=='__main__':unittest.main()
