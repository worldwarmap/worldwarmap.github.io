async function main() {
  // extract data from files
  var colorsText = await fetch('assets/colors.json', {cache: "no-store"});
  colors = await colorsText.json(); delete colors.junk;
  var eventsText = await fetch('assets/events.json', {cache: "no-store"});
  events = await eventsText.json();

  // get countries list
  countries = Object.keys(colors);
  months = ['December 2019']
  currMonth = months[0];
  
  function addButton(month) {
    var newDiv = document.createElement('a');
    newDiv.setAttribute('href', '#a');
    newDiv.setAttribute('class', 'month ' + month.replace(' ', '-'));
    newDiv.setAttribute('onclick', 'onMonthUpdate(\'' + month + '\')');
    newDiv.appendChild(document.createTextNode(month));
    document.getElementById('months').appendChild(newDiv);
  }
  addButton('December 2019');
  // set initial ownership of territories: each country owns itself
  var initialOwnership = {};
  countries.forEach(function(country) {
    initialOwnership[country] = country;
  });
  // populate ownerships array starting from december 2019 to current month
  ownerships = {'December 2019': initialOwnership};
  lastMonth = 'December 2019';
  events.forEach(function(event) {
    if (event.length) {
      var conqueror = event[2];
      var territory = event[3];
      var month = event[0] + ' ' + event[1];
      var ownership = {};
      Object.assign(ownership, ownerships[lastMonth]);
      ownership[territory] = conqueror;
      ownership['conqueror'] = conqueror;
      ownership['territory'] = territory;
      ownerships[month] = ownership;
      months.push(month);
      addButton(month);
      lastMonth = month;
    }
  });
  map = L.map('mapid').setView([0,0], 2);
  shpfile = new L.Shapefile('ne_110m_admin_0_countries.zip', {
    onEachFeature: function(feature, layer) {
      if (feature.properties) {
        layer.setStyle({
          color: '#000',
          weight: 1,
          fillColor: colors[feature.properties.GEOUNIT],
          //fillColor: '#'+(Math.floor(Math.random() * Math.floor(0xFFFFFF+1))+0xFFFFFF+1).toString(16).substr(-6),
          fillOpacity: 1,
        })
        layer.territory = feature.properties.GEOUNIT;
        layer.bindPopup('Territory: ' + layer.territory + '<br>Owner: ' + layer.territory);
      }
    }
  });
  shpfile.addTo(map);
}
function onMonthUpdate(month) {
  document.getElementsByClassName(currMonth.replace(' ', '-'))[0].style["background-color"] = "#bbb"
  currMonth = month;
  var currOwnership = ownerships[month];
  shpfile.setZIndex(100);
  shpfile.eachLayer(function(layer){
    var territory = layer.territory;
    var owner = currOwnership[territory];
    layer.setStyle({color: '#000', weight: 1, fillColor: colors[owner]});
    layer.bindPopup('Territory: ' + territory + '<br>Owner: ' + owner);
    if (month != 'December 2019') {
      if (owner == currOwnership.conqueror) {
        layer.setStyle({color: '#0f0', weight: 3});
      }
      if (territory == currOwnership.territory) {
        layer.setStyle({color: '#f00', weight: 3});
      } else if (owner == currOwnership.territory) {
        layer.setStyle({color: '#00f', weight: 3});
      }
    }
  });
  if (month == 'December 2019') {
    news = 'Peacetime.';
  }
  else {
    news = month + ', ' + currOwnership.conqueror + ' conquers ' + currOwnership.territory + '.';
  }
  document.getElementById('news').textContent = news;
  var clickedButton = document.getElementsByClassName(currMonth.replace(' ', '-'))[0];
  clickedButton.style["background-color"] = "#ff7";
}
document.addEventListener('keydown', function(e) {
  if (e.code == 'ArrowDown') {
    e.preventDefault();
    index = months.indexOf(currMonth);
    if (index < months.length-1) {
      onMonthUpdate(months[index+1]);
    }
  }
  if (e.code == 'ArrowUp') {
    e.preventDefault();
    index = months.indexOf(currMonth);
    if (index > 0) {
      onMonthUpdate(months[index-1]);
    }
  }
})
main();
