/******************************/
/********CORE JS FILE*********/
/****************************/

//globa map instantiation
var map = L.map('map').setView([26.537167, 92.788140], 8);
		
//loading dist overlay file 
var assam_js = $.ajax({
	  	url: "assets/assam.geojson",
	  	dataType: "json",
	  	success: console.log("assam boundary loaded"),
	  	error: function(xhr) {
	        alert(xhr.statusText)
	    }
	})

//loading district layer
var beki_data = $.ajax({
		url: "assets/beki_ws.json",
		dataType: "json",
		success: console.log("beki watershed loaded"),
		error: function (xhr) {
            alert(xhr.statusText)
		}
	})

var buridihing_data = $.ajax({
		url: "assets/buridihing_ws.json",
		dataType: "json",
		success: console.log("buridihing watershed loaded"),
		error: function (xhr) {
            alert(xhr.statusText)
		}
	})

var jiadhal_data = $.ajax({
		url: "assets/jiadhal_ws.json",
		dataType: "json",
		success: console.log("jiadhal watershed loaded"),
		error: function (xhr) {
            alert(xhr.statusText)
		}
	})


$.when(assam_js, beki_data, buridihing_data, jiadhal_data).done(function() {

	$('.preloader').fadeOut('slow');

	//marker instance
	var marker3;
	

	// For a list of basemaps see http://leaflet-extras.github.io/leaflet-providers/preview/
	var terrain = L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		subdomains: 'abcd',
		minZoom: 4,
		maxZoom: 18
	});


	// Add requested external GeoJSON to map
	var mydist_data = L.geoJSON(assam_js.responseJSON, {
		fillOpacity: 0,
		color: '#FF5733',
		weight: 4.0
	}).addTo(map);

	var beki_ws_data = L.geoJSON(beki_data.responseJSON, {
		fillOpacity: 0,
		color: '#4287f5',
		weight: 3.0
	}).addTo(map);

	buridihing_ws_data = L.geoJSON(buridihing_data.responseJSON, {
		fillOpacity: 0,
		color: '#4287f5',
		weight: 3.0
	}).addTo(map);

	jiadhal_ws_data = L.geoJSON(jiadhal_data.responseJSON, {
		fillOpacity: 0,
		color: '#4287f5',
		weight: 3.0
	}).addTo(map);


    d3.csv("data/hydromet.csv").then(function(data){

    	//call function on map instance load and function call
		data.forEach(function(d){
		
			marker3 = L.marker([d.LATITUDE, d.LONGITUDE], { icon: getIcon(d.EQUIPMENT) }).bindTooltip(d.STATION).bindPopup('<strong style="font-size: 14px; line-height: 2;">' + 'Station: ' + '</strong>' + d.STATION  +
								 '<br/>' + '<strong  style="font-size: 14px; line-height: 2;">' + 'District: '+ '</strong>' + d.DISTRICT +
								 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Site: '+ '</strong>' + d.SITE +
								 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Equipment: '+ '</strong>' + d.EQUIPMENT).addTo(map);
			marker3.openTooltip();
			marker3.closeTooltip();

		});

		//update total data count
		$("#dataCount").html(data.length)

	});

	//ESRI Leaflet integration (allows for use of ESRI WMS layers according to TOS)
	var esriImagery = L.esri.basemapLayer('Imagery').addTo(map),
		esriLabels = L.esri.basemapLayer('ImageryLabels');

	var basemaps = {
		'Terrain': terrain,
		'Satellite': esriImagery
	};

	var overlays = {
		/*'College/University': rusa,*/
		'Labels': esriLabels,
		'Assam District Boundary':mydist_data,
		'Beki Watershed':beki_ws_data,
		'Buridihing Watershed':buridihing_ws_data,
		'Jiadhal Watershed':jiadhal_ws_data
	};

	// Instantiate sidebar, open when Disclaimer modal is closed
    var sidebar = L.control.sidebar('sidebar', {
	    position: 'left'
	}).addTo(map);

	$('#disclaimer-modal').on('hidden.bs.modal', function () {
	    sidebar.show();
	});

	// Add native looking Leaflet buttons with Font Awesome icons
	L.easyButton(
		'fa-question-circle', 
    	function () {
    		$('#disclaimer-modal').modal();
    		sidebar.hide();
    	},
    	'Help!',
    	map
    );

    L.easyButton(
		'fa-list', 
    	function (){sidebar.toggle();},
    	'Legend Information',
    	map
    );

	L.control.scale().addTo(map);
	L.control.layers(basemaps, overlays).addTo(map);
	

	var calculateLayout = function (e) {
	var map = $('#map'),
		sidebar = $('#sidebar'),
		sideTitle = $('.sidebar-title'),
		sideContent = $('.sidebar-content'),
		win = $(window),
		header = $('header'),
		footer = $('footer');

		map.height( win.height() - header.height() - footer.height() );
		sidebar.height( win.height() - header.height() - footer.height() -50 );
		//sideContent.height( win.height() - sideContent.offset().top - 100 );
	};

	var resetLayout = _.debounce( calculateLayout,250 ); // Maximum run of once per 1/4 second for performance

	$(document).ready(function () {
		resetLayout();
		//$('#disclaimer-modal').modal(); // open modal on page load

	});

	// Resize the map based on window and sidebar size
	$(window).resize(resetLayout);

});
