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

module.exports.getDistance = getDistance;