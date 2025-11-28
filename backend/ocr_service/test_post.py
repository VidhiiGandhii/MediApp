import requests
files = {'file': ('test.png', open('test.png','rb'), 'image/png')}
r = requests.post('http://127.0.0.1:8001/ocr', files=files)
print(r.status_code)
print(r.text)
