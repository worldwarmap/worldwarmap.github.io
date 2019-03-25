import re
import itertools
from sys import argv

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
        'United Republic of Tanzania': 'Tanzania',
        'The Bahamas': 'Bahamas'
        }

willReadFile = True
isDone = False
rawText = fileIn.read()
fileOut.write('[\n')
latestYear = 2020
while rawText.find(str(latestYear)) != -1:
    latestYear += 1
for yr in range(2020, latestYear):
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
