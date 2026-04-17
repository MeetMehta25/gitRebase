import os
def search_dir(d):
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith('.py'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    try:
                        content = file.read()
                        if 'api/news' in content:
                            print(f'Found in {path}')
                    except:
                        pass
search_dir('server')
