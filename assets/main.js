// impt vars
var peacetime = 'December 2019';
var nameChange = {'The Bahamas': 'Bahamas', 'Republic of Serbia': 'Serbia'};
var legend = undefined;
async function main() {
  mapType = 0;
  // extract data from files
  var colorsText = await fetch('data/colors.json', {cache: "no-store"});
  colors = await colorsText.json(); delete colors.junk;
  var eventsText = await fetch('data/events.json', {cache: "no-store"});
  events = await eventsText.json();

  // get countries list
  countries = Object.keys(colors);
  abbrevs = {};
  months = [peacetime]
  currMonth = peacetime;
  
  // set initial ownership of territories: each country owns itself
  var initialOwnership = {};
  var initialEmpires = {};
  var initialSwitches = { max: 0 };
  countries.forEach(function(country) {
    initialOwnership[country] = country;
    initialEmpires[country] = [country];
    initialSwitches[country] = 0;
  });
  // populate ownerships & empires array starting from december 2019 to current month
  ownerships = {};
  ownerships[peacetime] = initialOwnership;
  ownerships[peacetime].news = 'Peacetime.';
  empiresHist = {};
  empiresHist[peacetime] = initialEmpires;

  switchesHist = {};
  switchesHist[peacetime] = initialSwitches;

  lastMonth = peacetime;
  events.forEach(function(event) {
    if (event.length) {
      var conqueror = event[2];
      var territory = event[3];
      var month = event[0] + ' ' + event[1];
      var ownership = {};
      Object.assign(ownership, ownerships[lastMonth]);
      ownership[territory] = conqueror;
      ownership.conqueror = conqueror;
      ownership.territory = territory;
      // save ownership to ownerships object
      ownerships[month] = ownership;

      // prerender news
      var lastOwner = ownerships[lastMonth][ownership.territory];
      ownership.news = month + ', ' + ownership.conqueror + ' conquers ' + ownership.territory + ' territory previously owned by ' + lastOwner + '.';

      // gen empires list
      var empires = JSON.parse(JSON.stringify(empiresHist[lastMonth]));
      empires[conqueror].push(territory);
      empires[lastOwner] = empires[lastOwner].filter(function(x) {
        return x != territory;
      });
      empiresHist[month] = empires;

      // gen switches hist
      var switches = JSON.parse(JSON.stringify(switchesHist[lastMonth]));
      switches[territory]++;
      if (switches[territory] > switches.max) {
        switches.max = switches[territory];
      }
      switchesHist[month] = switches;

      months.push(month);
      lastMonth = month;

    }
  });
  // initialize map
  map = L.map('mapid').setView([0,0], 2);
  stamen = L.tileLayer('http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg')
  stamen.addTo(map);
  // initialize shapefiles
  var layersDoneLoading = 0;
  shpfile = new L.Shapefile('ne_110m_admin_0_countries.zip', {
    // loop each country
    onEachFeature: function(feature, layer) {
      if (feature.properties) {
        layer.territory = feature.properties.GEOUNIT;
        if (layer.territory in nameChange) layer.territory = nameChange[layer.territory];
        abbrevs[layer.territory] = feature.properties.GU_A3;
        layer.setStyle({
          fillOpacity: 0.8,
          color: '#000',
          weight: 1,
          fillColor: colors[layer.territory]
        });
        layersDoneLoading += 1;
      }
    }
  });
  shpfile.addTo(map);

  var intervalId = setInterval(function() {
    if (layersDoneLoading == countries.length) {
      clearInterval(intervalId);
      addButtons('');
      onMonthUpdate(peacetime);
    }
  }, 100)
}
function addButton(month) {
  var newDiv = document.createElement('a');
  newDiv.setAttribute('href', '#a');
  newDiv.setAttribute('class', 'month ' + month.replace(' ', '-'));
  newDiv.setAttribute('onclick', 'onMonthUpdate(\'' + month + '\')');
  var cells = [
    month,
    abbrevs[ownerships[month].conqueror],
    '->',
    abbrevs[ownerships[month].territory]
  ];
  if (month == peacetime) cells = [month, '', '', ''];
  cells.forEach(function(cell) {
    var cellDiv = document.createElement('div');
    cellDiv.setAttribute('class', 'month-cell');
    cellDiv.appendChild(document.createTextNode(cell));
    newDiv.appendChild(cellDiv);
  });
  document.getElementById('months').appendChild(newDiv);
}

function addButtons(flt) {
  var filter = flt;
  var monthsDiv = document.getElementById('months');
  while (monthsDiv.firstChild) {
    monthsDiv.removeChild(monthsDiv.firstChild);
  }
  months.forEach(function(month) {
    var newsThisMonth = ownerships[month].news.toLowerCase();
    var flt = filter.toLowerCase();
    if (newsThisMonth.indexOf(flt) != -1) {
      addButton(month);
    }
  });
}

// updates the map, and buttons given the current month
function onMonthUpdate(month) {
  n = document.getElementsByClassName(currMonth.replace(' ', '-'));
  if (n.length > 0) {
    n[0].style["background-color"] = "#bbb";
  }
  currMonth = month;
  var currOwnership = ownerships[month];
  if (month != peacetime) {
    var lastMonth = months[months.indexOf(currMonth) - 1];
    var lastOwner = ownerships[lastMonth][currOwnership.territory];
  }
  shpfile.setZIndex(100);
  if (mapType == 1) {
    var switches = switchesHist[currMonth];
    var max = switches.max;
    function switchesColor(n) {
      if (max == 0) return HSVtoRGB(120/360, 0.4, 0.2);
      return HSVtoRGB(120/360 - (n / max) * (60/360), 0.4 + (n / max) * 0.6, 0.2 + (n / max) * 0.8);
      // return (Math.floor(n * 255 / max) * 0x10000 + 0xFFFFFF + 1).toString(16).replace('1', '#');
    }

    console.log(legend);
    if (legend) { map.removeControl(legend) };
    legend = L.control({position: 'topright'});
    legend.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info legend'),
          labels = [];
      for (var i = 0; i <= max; i++) {
        div.innerHTML +=
              '<i style="background:' + switchesColor(i) + '"></i> ' +
          i + ((i < max) ? '<div style="height: 4px;" />' : '');
      }

      return div;
    }
    legend.addTo(map);
  }
  var switches = switchesHist[currMonth];
  shpfile.eachLayer(function(layer){
    var territory = layer.territory;
    var owner = currOwnership[territory];
    if (mapType == 0) {
      layer.setStyle({color: '#000', weight: 1, fillColor: colors[owner], fillOpacity: 0.8});
      layer.bindPopup('Territory: ' + territory + '<br>Owner: ' + owner);
      if (month != peacetime) {
        if (owner == currOwnership.conqueror) {
          layer.setStyle({color: '#0f0', weight: 3});
        }
        if (territory == currOwnership.territory) {
          layer.setStyle({color: '#f00', weight: 3});
        }
        if (owner == lastOwner) {
          layer.setStyle({color: '#00f', weight: 3});
        }
      }
    } else if (mapType == 1) {
      layer.setStyle({color: '#000', weight: 1, fillColor: switchesColor(switches[territory]), fillOpacity: 1});
    }
  });
  document.getElementById('news').textContent = currOwnership.news;
  var clickedButton = document.getElementsByClassName(currMonth.replace(' ', '-'))[0];
  clickedButton.style["background-color"] = "#ff7";

  var currEmpires = empiresHist[month];
  var sortedEmpires = Object.keys(currEmpires).sort(function(a, b) {
    return currEmpires[b].length - currEmpires[a].length;
  });
  var empiresTableBody = document.getElementById('empires-table-body');
  while (empiresTableBody.firstChild) {
    empiresTableBody.removeChild(empiresTableBody.firstChild);
  }
  var totalEmpires = 0;
  sortedEmpires.forEach(function(empire, i) {
    if (currEmpires[empire].length) {
      var rank = (i + 1).toString();
      var territoriesStr = '(' + currEmpires[empire].length + ') ' + currEmpires[empire].join(', ');

      var newRow = document.createElement('div');
      newRow.setAttribute('class', 'rTableRow');
      var cells = [
        rank,
        empire,
        territoriesStr
      ];
      cells.forEach(function(cell) {
        var cellDiv = document.createElement('div');
        cellDiv.setAttribute('class', 'rTableCell');
        cellDiv.appendChild(document.createTextNode(cell));
        newRow.appendChild(cellDiv);
      });
      empiresTableBody.appendChild(newRow);
      totalEmpires += 1;
    }
  });
  document.getElementById('empire-number').textContent = totalEmpires;
}

function goToLatest() {
  latestMonth = months[months.length - 1];
  onMonthUpdate(latestMonth);
  document.getElementsByClassName(latestMonth.replace(' ', '-'))[0].focus();
}

function toggleSwitchesMap() {
  mapType++;
  mapType %= 2;
  if (mapType == 0) {
    stamen.addTo(map);
  }
  if (mapType == 1) {
    stamen.removeFrom(map);
  }
  onMonthUpdate(currMonth);
}

// key events (up down arrow, etc)
document.addEventListener('keydown', function(e) {
  if (e.code == 'ArrowDown' || e.code == 'ArrowUp') {
    e.preventDefault();
    n = document.getElementsByClassName(currMonth.replace(' ', '-'));
    if (n.length == 0) {
      currButton = document.getElementById('months').firstChild;
    } else {
      currButton = n[0];
    }
    if (e.code == 'ArrowDown') {
      var nextSib = currButton.nextSibling;
      if (nextSib) {
        onMonthUpdate(nextSib.firstChild.textContent);
      }
    } else {
      var prevSib = currButton.previousSibling;
      if (prevSib) {
        onMonthUpdate(prevSib.firstChild.textContent);
      }
    }
  }
})

document.getElementById('search-bar').addEventListener('input', function(e) {
  var searchText = document.getElementById('search-bar').value;
  addButtons(searchText);
});
main();


function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    /*
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
    */
    var r = Math.round(r * 255);
    var g = Math.round(g * 255);
    var b = Math.round(b * 255);
    return (((r * 256) + g) * 256 + b + 0xFFFFFF + 1).toString(16).replace('1', '#');
}
