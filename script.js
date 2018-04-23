// Edit the initial year and number of tabs to match your GeoJSON data and tabs in index.html
var year = "01";
var tabs = 7;

// Edit the center point and zoom level
var map = L.map('map', {
  center: [35.8, -78.63],
  zoom: 10,
  scrollWheelZoom: false
});

// Edit links to your GitHub repo and data source credit
map.attributionControl
  .setPrefix('View <a href="http://github.com/jackdougherty/leaflet-map-polygon-tabs">data and code on GitHub</a>, created with <a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>; design by <a href="http://ctmirror.org">CT Mirror</a>');

// Basemap layer
new L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

var sql = new cartodb.SQL({
  user: 'maptastik'
});
sql.execute("SELECT z.the_geom, z.zipnum, acr01, acr02, acr03, acr04, acr05, acr06, acr07 FROM zip_codes z JOIN budget_survey_results r ON z.zipnum = r.zipcode",
{}, {
    format: "GeoJSON"
})
  .done(function (data) {
    geoJsonLayer = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map)

    // Edit range cutoffs and colors to match your data; see http://colorbrewer.org
    // Any values not listed in the ranges below displays as the last color
    function getColor(d) {
      return d > 0.8 ? '#006d2c' :
        d > 0.6 ? '#31a354' :
        d > 0.4 ? '#74c476' :
        d > 0.2 ? '#bae4b3' :
        d > 0 ? '#edf8e9' :
        'white';
    }

    // Edit the getColor property to match data properties in your GeoJSON file
    // In this example, columns follow this pattern: index1910, index1920...
    function style(feature) {
      console.log(`fillColor: acr${year}`)
      return {
        fillColor: getColor(feature.properties["acr" + year]),
        weight: 1,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.9
      };
    }

    // This highlights the polygon on hover, also for mobile
    function highlightFeature(e) {
      resetHighlight(e);
      var layer = e.target;
      layer.setStyle({
        weight: 4,
        color: 'black',
        fillOpacity: 0.7
      });
      info.update(layer.feature.properties);
    }

    // This resets the highlight after hover moves away
    function resetHighlight(e) {
      geoJsonLayer.setStyle(style);
      info.update();
    }

    // This instructs highlight and reset functions on hover movement
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: highlightFeature
      });
    }

    // Creates an info box on the map
    var info = L.control();
    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update();
      return this._div;
    };

    // Edit info box labels (such as props.town) to match properties of the GeoJSON data
    info.update = function (props) {
      var winName =
        this._div.innerHTML = (props ?
          '<div class="areaName">' + props.zipnum + '</div>' : '<div    class="areaName faded"><small>Hover over areas<br>Click tabs or arrow keys</small></div>') + '<div class="areaLabel"><div class="areaValue">Respondents who prioritize: </div>' + (props ? '' + (checkNull(props["acr" + year]*100)) + '%' : '--') + '</div>';
    };
    info.addTo(map);

    // When a new tab is selected, this changes the year displayed
    $(".tabItem").click(function () {
      $(".tabItem").removeClass("selected");
      $(this).addClass("selected");
      var year2 = $(this).html();
      year =`0${$(this).val()}`
      geoJsonLayer.setStyle(style);
    });

    // Edit grades in legend to match the range cutoffs inserted above
    // In this example, the last grade will appear as "2+"
    var legend = L.control({
      position: 'bottomright'
    });
    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 20, 40, 60, 80],
        labels = [],
        from, to;
      for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];
        // manually inserted from + 0.1 to start one step above default 0 = white color
        labels.push(
          '<i style="background:' + getColor(from/100 + 0.1) + '"></i> ' +
          from + (to ? '&ndash;' + to : '+'));
      }
      div.innerHTML = labels.join('<br>');
      return div;
    };
    legend.addTo(map);

    // In info.update, this checks if GeoJSON data contains a null value, and if so displays "--"
    function checkNull(val) {
      if (val != null || val == "NaN") {
        return comma(val);
      } else {
        return "--";
      }
    }

    // Use in info.update if GeoJSON data needs to be displayed as a percentage
    function checkThePct(a, b) {
      if (a != null && b != null) {
        return Math.round(a / b * 1000) / 10 + "%";
      } else {
        return "--";
      }
    }

    // Use in info.update if GeoJSON data needs to be displayed with commas (such as 123,456)
    function comma(val) {
      while (/(\d+)(\d{3})/.test(val.toString())) {
        val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
      }
      return val;
    }

    // This watches for arrow keys to advance the tabs
    $("body").keydown(function (e) {
      var selectedTab = parseInt($(".selected").attr('id').replace('tab', ''));
      var nextTab;

      // previous tab with left arrow
      if (e.keyCode == 37 || e.keyCode == 38) {
        nextTab = (selectedTab == 1) ? tabs : selectedTab - 1;
      }
      // next tab with right arrow
      else if (e.keyCode == 39 || e.keyCode == 40) {
        nextTab = (selectedTab == tabs) ? 1 : selectedTab + 1;
      }

      $('#tab' + nextTab).click();
    });
  })
  .error(function (errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })