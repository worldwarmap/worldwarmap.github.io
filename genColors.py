import random
fileIn = open('assets/countries.txt', 'r')
fileOut = open('assets/colors.json', 'w')

fileOut.write('{\n')
for line in fileIn.readlines():
    randomColor = '#' + '{0:0{1}x}'.format(random.randint(0,0xffffff),6)
    fileOut.write('"' + line[:-1] + '": "' + randomColor + '",\n')
fileOut.write('"junk": 0}\n')
