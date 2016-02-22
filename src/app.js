var myTisseoAPIKey = '039b8682-0e96-48d6-914d-17e9148bd026';

var UI = require('ui');
var ajax = require('ajax');

var Vector2 = require('vector2');

//var Accel = require('ui/accel');
//var Vibe = require('ui/vibe');

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 10000, 
  timeout: 10000
};

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(lonA,latA,lonB,latB) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(latB - latA);
  var dLong = rad(lonB - lonA);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(latA)) * Math.cos(rad(latB)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function locationSuccess(pos) {
	// Text element to inform user
	var text = new UI.Text({
	  position: new Vector2(0, 0),
	  size: new Vector2(144, 168),
	  text:'Chargement des données de transport pour Toulouse...',
	  font:'GOTHIC_28_BOLD',
	  color:'black',
	  textOverflow:'wrap',
	  textAlign:'center',
	  backgroundColor:'white'
	});

	// Add to splashWindow and show
	splashWindow.add(text);
	splashWindow.show();	

  console.log('lat= ' + pos.coords.latitude + ' lon= ' + pos.coords.longitude);
	console.log('Dist AO = '+ getDistance(1.443578,43.597081,pos.coords.longitude,pos.coords.latitude)+' m');
	console.log('Dist OB = ' + getDistance(pos.coords.longitude,pos.coords.latitude,1.445874,43.600546)+' m');
	var dX = 0.002;
	var dY = dX;
	console.log('Dist A1O = '+ getDistance(pos.coords.longitude-dX,pos.coords.latitude-dY,pos.coords.longitude,pos.coords.latitude)+' m');
	console.log('Dist OB1 = ' + getDistance(pos.coords.longitude,pos.coords.latitude,pos.coords.longitude+dX,pos.coords.latitude+dY)+' m');

	// Make request to Tisseo
	ajax(
	{
		url:'https://api.tisseo.fr/v1/stop_areas.json?srid=4326&bbox='+
				(pos.coords.longitude-dX)+','+(pos.coords.latitude-dY)+','+(pos.coords.longitude+dX)+','+(pos.coords.latitude+dY)+
				'&displayCoordXY=1' + '&key=' + myTisseoAPIKey ,
		type:'json'
	},
		function(data) {
			var nb = data.stopAreas.stopArea.length;
			var parseFeed = function(data, quantity) {
				var items = [];
				for(var i = 0; i < quantity; i++) {
					// Always upper case the description string
					var title = data.stopAreas.stopArea[i].name;
					title = title.charAt(0).toUpperCase() + title.substring(1);
					// Get date/time substring
					var distance =  Math.round(getDistance(pos.coords.longitude,pos.coords.latitude,data.stopAreas.stopArea[i].x,data.stopAreas.stopArea[i].y))+' m';
					// Add to menu items array
					items.push({
					title:title,
					subtitle:distance
					});
				}
			// Finally return whole array
			return items;
		};
		
		// Create an array of Menu items
		var zoneDArret = parseFeed(data, nb);
		
		// Check the items are extracted OK
		for(var i = 0; i < zoneDArret.length; i++) {
			console.log(zoneDArret[i].title + ' | ' + zoneDArret[i].subtitle);
		}
		
		// Construct Menu to show to user
		var resultsMenu = new UI.Menu({
			sections: [{
				title: 'Zones d\'arrêt',
				items: zoneDArret
			}]
		});
		// Add an action for SELECT
		resultsMenu.on('select', function(e) {
			console.log('Item number ' + e.itemIndex + ' was pressed!');
			// Add an action for SELECT
			var id = data.stopAreas.stopArea[e.itemIndex].id;
			ajax(
				{
					url:'https://api.tisseo.fr/v1/stops_schedules.json?stopAreaId='+id+'&maxDays=1' +
					'&key=' + myTisseoAPIKey,
					type:'json'
				},
				function(json) {
					// Create an array of Menu items
					var nb = json.departures.departure.length;
				
					var parseFeed = function(data, quantity) {
						var items = [];
						for(var i = 0; i < quantity; i++) {
								//var departure = data.departures.departure[i];
								
								var time = json.departures.departure[i].dateTime;
								var disptime = time.substring(11,16);
								
								// Get date/time substring
								var subdest1 = json.departures.departure[i].line.shortName;
								var subdest2 = json.departures.departure[i].destination[0].name;
								var dest = subdest1.toUpperCase() + ' - ' + subdest2; 
								console.log(disptime + '|'+ dest);
								// Add to menu items array
								items.push({
								title:disptime,
								subtitle:dest
							});
						}
					
						// Finally return whole array
						return items;
					};
					var menuItemsHoraires;
					if (nb>0) {
							menuItemsHoraires = parseFeed(json,nb);
					} else {
							var items = [];
							items.push({title:"Ce jour",subtitle:"pas de passage"});
							menuItemsHoraires = items;
					}
						
					for(var i = 0; i < menuItemsHoraires.length; i++) {
							console.log(menuItemsHoraires[i].title + ' | ' + menuItemsHoraires[i].subtitle);
					}
					
					//var subMenuItems = parseFeed(data, nb);
						
					// Update the Menu's first section
					
					
					//subResultsMenu.items(0, subMenuItems);
					var subResultsMenu = new UI.Menu({
						sections: [{
							title: 'Horaires',
							items: menuItemsHoraires
						}]
					});
					
					subResultsMenu.show();
						// Notify the user
						//Vibe.vibrate('short');
						//console.log('short vibration!');
					//	return items;
			},
				function(error) {
					console.log('Detail Download failed : ' + error);
				}
			);
/* 
			
			
			
			var forecast = data.list[e.itemIndex];

			// Assemble body string
			var content = data.list[e.itemIndex].weather[0].description;

			// Capitalize first letter
			content = content.charAt(0).toUpperCase() + content.substring(1);
	
			// Add temperature, pressure etc
			content += '\nTemperature: ' + forecast.main.temp + '°C' +
				'\nPressure: ' + Math.round(forecast.main.pressure) + ' mbar' +
				'\nWind: ' + Math.round(forecast.wind.speed) + ' mph, '	+ 
				Math.round(forecast.wind.deg) + '°';
			
			// Create the Card for detailed view
			var detailCard = new UI.Card({
			title:'Details',
			subtitle:e.item.subtitle,
				body: content
			});
			detailCard.show(); */
			
		});
		
		// Show the Menu, hide the splash
		resultsMenu.show();
		splashWindow.hide();
	},
	    function(error) {
			console.log('Main Download failed: ' + error);
		}
	);
}

function locationError(err) {
	// Text element to inform user
	var text2 = new UI.Text({
	  position: new Vector2(0, 0),
	  size: new Vector2(144, 168),
	  text:'Erreur de localisation...',
	  font:'GOTHIC_28_BOLD',
	  color:'black',
	  textOverflow:'wrap',
	  textAlign:'center',
	  backgroundColor:'white'
	});

	// Add to splashWindow and show
	splashWindow.add(text2);
	splashWindow.show();	
	console.log('location error (' + err.code + '): ' + err.message);
	console.log('Dist AB = ' + getDistance(1.443578,43.597081,1.445874,43.600546)+' m');
	//var lat= 43.599548726668566;
	//var lon= 1.445160303456474;
}

// Make an asynchronous request
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

// Prepare the accelerometer
//Accel.init();