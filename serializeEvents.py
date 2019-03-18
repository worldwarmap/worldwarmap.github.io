import re
import itertools
from sys import argv

if len(argv) < 2:
    raise Exception('Type latest year in argument (is okay if a few years ahead) e.g. python3 serializeEvents.py 2050')

fileIn = open('data/events.txt', 'r')
fileOut = open('data/events.json', 'w')
months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

pattern = r'{} {}, ([\w ]+?) conquered ([\w \.\-]+?)( territory|$)'

cleanCountries = {
        'Solomon Is.': 'Solomon Islands',
        'Eq. Guinea': 'Equatorial Guinea',
        'N. Cyprus': 'Northern Cyprus',
        'Dominican Rep.': 'Dominican Republic',
        'Republic of Serbia': 'Serbia',
        'United Republic of Tanzania': 'Tanzania'
        }

willReadFile = True
isDone = False
rawText = fileIn.read()
fileOut.write('[\n')
for yr in range(2020, int(argv[1])+1):
    yr = str(yr)
    for mn in months:
        searchResults = re.search(pattern.format(mn, yr), rawText, re.M)
        if searchResults:
            items = [mn, yr] + list(searchResults.groups()[:-1])
            if items[3] in cleanCountries:
                items[3] = cleanCountries[items[3]]
            fileOut.write(str(items).replace('\'', '"') + ',\n')
        else:
            print("Missing: {} {}".format(mn, yr))
            continue
    if isDone:
        break
    
fileOut.write('[]]\n')
