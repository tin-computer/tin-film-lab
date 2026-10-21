import json,unittest
from collect import mixkit_video
class MetadataTests(unittest.TestCase):
 def page(self,objects):return '<script type="application/ld+json">'+json.dumps({'@graph':objects})+'</script>'
 def item(self,**changes):return {'@type':'VideoObject','name':'A','license':'https://mixkit.co/license/#videoFree','contentUrl':'https://assets.mixkit.co/videos/1/1-720.mp4',**changes}
 def test_primary_metadata(self):self.assertEqual(mixkit_video(self.page([{'@type':'OnlineBusiness'},self.item()]))['name'],'A')
 def test_restricted(self):
  with self.assertRaises(ValueError):mixkit_video(self.page([self.item(license='https://mixkit.co/license/#videoRestricted')]))
 def test_ad_host(self):
  with self.assertRaises(ValueError):mixkit_video(self.page([self.item(contentUrl='https://ads.example/video.mp4')]))
 def test_multiple(self):
  with self.assertRaises(ValueError):mixkit_video(self.page([self.item(),self.item()]))
if __name__=='__main__':unittest.main()
