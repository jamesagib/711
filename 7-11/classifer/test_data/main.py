import json

#file_name = 'classifer/test_data/test.json'

def remove_duplicates(file_name):
    with open(file_name, 'r') as f:
        data = json.load(f)

    data.sort(key=lambda x: x['title'])
    for i in range(len(data) - 1, 0, -1):
        if data[i]['title'] == data[i - 1]['title']:
            data.pop(i)

    with open(file_name, 'w') as f:
        json.dump(data, f, indent=4, ensure_ascii=False, sort_keys=True)

def append_data(file_name, temp_file_name):
    with open(file_name, 'r') as f:
        data = json.load(f)
    with open(temp_file_name, 'r') as f:
        temp_data = json.load(f)
    data.extend(temp_data)
    with open(file_name, 'w') as f:
        json.dump(data, f, indent=4, ensure_ascii=False, sort_keys=True)

if __name__ == "__main__":
    print("Options:")
    print("1. Remove duplicates")
    print("2. Append data")
    print("3. Exit")
    choice = input("Enter your choice: ")
    if choice == "1":
        file_name = input("Enter the file name: ")
        remove_duplicates(file_name)
    elif choice == "2":
        file_name = "classifer/test_data/data.json"
        temp_file_name = input("Enter the file name: ")
        append_data(file_name, temp_file_name)
    elif choice == "3":
        exit()
    else:
        print("Invalid choice")