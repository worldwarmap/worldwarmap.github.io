// impt vars
var peacetime = 'December 2019';
var nameChange = {'The Bahamas': 'Bahamas', 'Republic of Serbia': 'Serbia'};
async function main() {
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
  countries.forEach(function(country) {
    initialOwnership[country] = country;
  });
  // populate ownerships array starting from december 2019 to current month
  ownerships = {};
  ownerships[peacetime] = initialOwnership;
  ownerships[peacetime].news = 'Peacetime.';
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

      // prerender news
      var lastOwner = ownerships[lastMonth][ownership.territory];
      ownership.news = month + ', ' + ownership.conqueror + ' conquers ' + ownership.territory + ' territory previously owned by ' + lastOwner + '.';

      // save ownership to ownerships object
      ownerships[month] = ownership;
      months.push(month);
      lastMonth = month;
    }
  });
  // initialize map
  map = L.map('mapid').setView([0,0], 2);
  L.tileLayer('http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg').addTo(map);
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
          fillOpacity: 0.7,
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
    }
  }, 100)
}
function addButton(month) {
  var newDiv = document.createElement('a');
  newDiv.setAttribute('href', '#a');
  newDiv.setAttribute('class', 'month ' + month.replace(' ', '-'));
  newDiv.setAttribute('onclick', 'onMonthUpdate(\'' + month + '\')');
  // console.log(abbrevs);
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
    if (newsThisMonth == "june 2045, syria conquers iraq territory previously owned by iraq.") console.log(newsThisMonth, '|', flt);
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
  shpfile.eachLayer(function(layer){
    var territory = layer.territory;
    var owner = currOwnership[territory];
    layer.setStyle({color: '#000', weight: 1, fillColor: colors[owner]});
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
  });
  document.getElementById('news').textContent = currOwnership.news;
  var clickedButton = document.getElementsByClassName(currMonth.replace(' ', '-'))[0];
  clickedButton.style["background-color"] = "#ff7";
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
