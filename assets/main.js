async function main() {
  // extract data from files
  var colorsText = await fetch('assets/colors.json');
  colors = await colorsText.json(); delete colors.junk;
  var eventsText = await fetch('assets/events.json');
  events = await eventsText.json();

  // get countries list
  countries = Object.keys(colors);
  // set initial ownership of territories: each country owns itself
  var initialOwnership = {};
  countries.forEach(function(country) {
    initialOwnership[country] = country;
  });
  // populate ownerships array starting from december 2019 to current month
  ownerships = [["December 2019", initialOwnership]];
  events.forEach(function(event) {
    if (event.length) {
      var conqueror = event[2];
      var territory = event[3];
      var date = event[0] + ' ' + event[1];
      var ownership = {};
      Object.assign(ownership, ownerships[ownerships.length-1][1]);
      ownership[territory] = conqueror;
      ownerships.push([date, ownership]);
    }
  });
  map = L.map('mapid').setView([0,0], 2);
  var shpfile = new L.Shapefile('ne_110m_admin_0_countries.zip', {
    onEachFeature: function(feature, layer) {
      if (feature.properties) {
        layer.setStyle({
          color: '#000',
          weight: 1,
          fillColor: colors[feature.properties.GEOUNIT],
          //fillColor: '#'+(Math.floor(Math.random() * Math.floor(0xFFFFFF+1))+0xFFFFFF+1).toString(16).substr(-6),
          fillOpacity: 1,
        })
        layer.bindPopup(feature.properties.GEOUNIT);
      }
    }
  });
  shpfile.addTo(map);
}
main();
