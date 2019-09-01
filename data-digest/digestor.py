import os 
import pandas as pd





def digest(file):
    #f = open(file, 'r')
    #data = [json.loads(line) for line in open(file, 'r')]
    df = pd.read_json(file, lines=True)
    print(df)


if __name__ == '__main__':
    [digest(entry) for entry in os.scandir('../../data/') if entry.is_file()]