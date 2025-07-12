import json

file_name = 'classifer/test_data/test.json'

with open(file_name, 'r') as f:
    data = json.load(f)

for i in range(len(data) - 1, 0, -1):
    if data[i]['title'] == data[i - 1]['title']:
        data.pop(i)

with open(file_name, 'w') as f:
    json.dump(data, f, indent=4, ensure_ascii=False, sort_keys=True)


