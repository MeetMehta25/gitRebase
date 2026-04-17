import sys, json; print(json.load(sys.stdin).get('success', False))
