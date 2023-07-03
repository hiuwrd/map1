/******************************/
/********CORE JS FILE*********/
/****************************/

//globa map instantiation
var map = L.map('map').setView([26.137167, 91.788140], 11);
//global dist overlay
var distOverlayurl,distOverlaydata;
		
//loading dist overlay file 
var loader_js = $.ajax({
	  	url: "scripts/getOverlay.js",
	  	dataType: "script",
	  	success: console.log("district overlay filter module loaded"),
	  	error: function(xhr) {
	        alert(xhr.statusText)
	    }
	})

//for searchable dropdown
var college_array = Array();

//loading district layer
var dist_data = $.ajax({
		url: "backend/dist_bound.php",
		dataType: "json",
		success: console.log("district boundary module loaded"),
		error: function (xhr) {
            alert(xhr.statusText)
		}
	})
//kamrup m bound loading
var kamrup_m_data = $.ajax({
	url: "backend/kamrup_m_bound.php",
	dataType: "json",
	success: console.log("kamrup m boundary module loaded"),
	error: function (xhr) {
		alert(xhr.statusText)
	}
})

//gmc ward bound loading
var gmc_ward_data = $.ajax({
	url: "backend/gmc_ward.php",
	dataType: "json",
	success: console.log("gmc ward boundary module loaded"),
	error: function (xhr) {
		alert(xhr.statusText)
	}
})

//kamrup m roads loading
var kamrup_m_road_data = $.ajax({
	url: "backend/kamrup_m_roads.php",
	dataType: "json",
	success: console.log("kamrup m roads module loaded"),
	error: function (xhr) {
		alert(xhr.statusText)
	}
})


$.when(loader_js, dist_data, kamrup_m_data, gmc_ward_data, kamrup_m_road_data).done(function() {

	var createMap = function () {

		$('.preloader').fadeOut('slow');

		//marker instance
		var marker3;
		//marker group
		var myMarkerGroup = L.layerGroup().addTo(map);
		

		// For a list of basemaps see http://leaflet-extras.github.io/leaflet-providers/preview/
		var terrain = L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
			attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
			subdomains: 'abcd',
			minZoom: 4,
			maxZoom: 18
		});


		// Add requested external GeoJSON to map
		//console.log(dist_data.responseJSON)
		var mydist_data = L.geoJSON(dist_data.responseJSON, {
			fillOpacity: 0,
			color: '#FF5733',
			weight: 3.0
		});
		var KAMRUP_METRO = L.geoJSON(kamrup_m_data.responseJSON, {
			fillOpacity: 0,
			color: '#33C3FF',
			weight: 2.50
		});

		var GMC_WARD = L.geoJSON(gmc_ward_data.responseJSON, {
			fillOpacity: 0,
			color: '#FFDB33',
			weight: 2.50
		});

		var KAMRUP_ROAD = L.geoJSON(kamrup_m_road_data.responseJSON, {
			fillOpacity: 0,
			color: '#2c2c2c',
			weight: 2.50
		});


	    d3.csv("data/rusa_data.csv").then(function(data){

	    	//for searchable dropdown, add college/institute to array
	    	let x = 0;
	    	data.forEach(function(d){

	    		college_array[x] = d.College_University
	    		x++;

	    	})

	    	//call function on map instance load and function call
	    	function mapLoadnReset(){
	    		data.forEach(function(d){
	    		
	    			marker3 = L.marker([d.Latitude, d.Longitude], { icon: getIcon(d.type) }).bindTooltip(d.College_University).bindPopup('<strong style="font-size: 14px; line-height: 2;">' + 'Institute: ' + '</strong>' + d.College_University  +
										 '<br/>' + '<strong  style="font-size: 14px; line-height: 2;">' + 'District: '+ '</strong>' + d.District +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Subdivision: '+ '</strong>' + d.Subdivision +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Revenue Circle: '+ '</strong>' + d.Revenue_Circle +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Mouja: '+ '</strong>' + d.Mouja +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Town/Village: '+ '</strong>' + d.Municipal_Town_Village +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.Post_Office +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.PS +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'PinCode: '+ '</strong>' + d.PinCode +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_hectare: '+ '</strong>' + d.Area_in_hectare +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_sq_m: '+ '</strong>' + d.Area_in_sq_m +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Ward: '+ '</strong>' + d.ward +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Type: '+ '</strong>' + d.type +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Image: '+ '</strong><a href="' + d.image + '" target="_blank">click here</a>').addTo(myMarkerGroup);
	    			marker3.openTooltip();
	    			marker3.closeTooltip();

	    		});

	    		//update total data count
	    		$("#dataCount").html(data.length)
				if (distOverlaydata != undefined) { map.removeLayer(distOverlaydata); }


				//select2 js, pass data array to 'data' tag
				$("#search").select2({

					placeholder: "Search for College / University / Institute",
    				allowClear: true,
                  	data: college_array
                });

                //Bind an event
				$("#search").on('select2:select', function (e) {
					let selected_data = e.params.data;

    				//trigger change
    				myFilteredData = data.filter(function(d){return d.College_University == selected_data.text})
    				
    				//fly to region of interest
		    		map.flyTo([myFilteredData[0].Latitude,myFilteredData[0].Longitude], 19, {
			            animate: true,
			            duration: 2 // in seconds
			        });

				});


	    	}

	    	//call function,load the map
	    	mapLoadnReset();

	    	//list of an id, mapped and extracted unique keys based on identifier
	    	var allGroup = d3.map(data, function(d){return(d.District)}).keys();
			var allTypes = d3.map(data, function(d){return(d.type)}).keys();
	    	//console.log(allGroup);

	    	//visualization update of markers on the basis of id selected
	    	function updateViz(selectedDistrict){
	    		
	    		//filter function to select rows from original dataset on the basis of dropdown identifier selection
	    		myFilteredData = data.filter(function(d){return d.District == selectedDistrict})

	    		//update total data count in the selected district
	    		$("#dataCount").html(myFilteredData.length)

	    		//clear markers within previous marker group
	    		myMarkerGroup.clearLayers()

	    		//overlay the dist layer
	    		//Add requested external GeoJSON to map
	    		distOverlayurl = getOverlay(selectedDistrict)
	    		
	    		if (distOverlaydata != undefined) { map.removeLayer(distOverlaydata); }
	    		
	    		$.getJSON(distOverlayurl, function (data) {
			
					distOverlaydata = L.geoJSON(data).addTo(map);
					//console.log(data)
					
				});

	    		//get coordinates for selectedDistrict
	    		coord = getCoord(selectedDistrict)

	    		//fly to region of interest
	    		map.flyTo([coord[0],coord[1]], 11, {
		            animate: true,
		            duration: 2 // in seconds
		        });

	    		//plot new data derived from filter function
	    		myFilteredData.forEach(function(d){
	    		
	    			marker3 = L.marker([d.Latitude, d.Longitude], { icon: getIcon(d.type) }).bindTooltip(d.College_University).bindPopup('<strong style="font-size: 14px; line-height: 2;">' + 'Institute: ' + '</strong>' + d.College_University  +
										 '<br/>' + '<strong  style="font-size: 14px; line-height: 2;">' + 'District: '+ '</strong>' + d.District +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Subdivision: '+ '</strong>' + d.Subdivision +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Revenue Circle: '+ '</strong>' + d.Revenue_Circle +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Mouja: '+ '</strong>' + d.Mouja +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Town/Village: '+ '</strong>' + d.Municipal_Town_Village +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.Post_Office +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.PS +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'PinCode: '+ '</strong>' + d.PinCode +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_hectare: '+ '</strong>' + d.Area_in_hectare +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_sq_m: '+ '</strong>' + d.Area_in_sq_m +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Ward: '+ '</strong>' + d.ward +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Type: '+ '</strong>' + d.type +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Image: '+ '</strong><a href="' + d.image + '" target="_blank">click here</a>').addTo(myMarkerGroup);
		    		marker3.openTooltip();
		    		marker3.closeTooltip();
		    	});
	    		
	    	}

	    	/*dropdown menu for district filter*/
	    	//adding options to the button
	    	d3.select("#selectButton")
			    .selectAll('myOptions')
			    .data(allGroup)
			    .enter()
			    .append('option')
			    .text(function (d) { return d; }) // text showed in the menu
			    .attr("value", function (d) { return d; }) // corresponding value returned by the button


			//update on dropdown select event
			d3.select("#selectButton").on("change", function(d){
				selectedDistrict = this.value
				//console.log(selectedDistrict)
				updateViz(selectedDistrict)
			})

			/*dropdown for college type filter */
			//adding options to selectButton2
			d3.select("#selectButton2")
				.selectAll('myOptions')
				.data(allTypes)
				.enter()
				.append('option')
				.text(function (d) { return d; }) //text under dropdown
				.attr("value", function (d) { return d; })

			//update on dropdown select event
			d3.select("#selectButton2").on("change", function(d){
				selectedType = this.value
				//console.log(selectedType)
				myFilteredData2 = data.filter(function(d){return d.type == selectedType})
				
				myMarkerGroup.clearLayers()
				if (distOverlaydata != undefined) { map.removeLayer(distOverlaydata); }
				//fly to region of interest
	    		map.flyTo([26.137167, 91.788140], 9, {
		            animate: true,
		            duration: 2 // in seconds
		        });


				//plot new data derived from filter function
	    		myFilteredData2.forEach(function(d){
	    		
	    			marker3 = L.marker([d.Latitude, d.Longitude], { icon: getIcon(d.type) }).bindTooltip(d.College_University).bindPopup('<strong style="font-size: 14px; line-height: 2;">' + 'Institute: ' + '</strong>' + d.College_University  +
										 '<br/>' + '<strong  style="font-size: 14px; line-height: 2;">' + 'District: '+ '</strong>' + d.District +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Subdivision: '+ '</strong>' + d.Subdivision +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Revenue Circle: '+ '</strong>' + d.Revenue_Circle +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Mouja: '+ '</strong>' + d.Mouja +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Town/Village: '+ '</strong>' + d.Municipal_Town_Village +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.Post_Office +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' +'Post Office: '+ '</strong>' + d.PS +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'PinCode: '+ '</strong>' + d.PinCode +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_hectare: '+ '</strong>' + d.Area_in_hectare +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Area_in_sq_m: '+ '</strong>' + d.Area_in_sq_m +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Ward: '+ '</strong>' + d.ward +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Type: '+ '</strong>' + d.type +
										 '<br/>' + '<strong style="font-size: 14px; line-height: 2;">' + 'Image: '+ '</strong><a href="' + d.image + '" target="_blank">click here</a>').addTo(myMarkerGroup);
		    		marker3.openTooltip();
		    		marker3.closeTooltip();
		    	});

			})

			//map data reset
			$("#resetMap").on("click", function(d){
				//clear markers within previous marker group
	    		myMarkerGroup.clearLayers();
	    		//reset dropdown menu to first item on list
	    		$("#selectButton")[0].selectedIndex = 0;
	    		//fly to region of interest
	    		map.flyTo([26.137167, 91.788140], 10, {
		            animate: true,
		            duration: 2 // in seconds
		          });
	    		//f^n call
				mapLoadnReset();
			})

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
			'Road': KAMRUP_ROAD,
			'GMC WARD Boundary':GMC_WARD,
			'Kamrup Metro Boundary' :KAMRUP_METRO,
			'Assam District Boundary':mydist_data
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
	};

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
		createMap();

		//$('#disclaimer-modal').modal(); // open modal on page load

	});

	// Resize the map based on window and sidebar size
	$(window).resize(resetLayout);

});
