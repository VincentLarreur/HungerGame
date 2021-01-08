// Get configuration
var config = require('./config/config.js');

console.log('-- Starting server');

// Start socket API service
var SocketAPI = require('./api/socket_api.js');
socket_api = new SocketAPI();
socket_api.startService(
    config.config.port,
    config.config.nbRooms, 
    config.config.taille, 
    config.config.nbBonbons);

console.log('-- Server started on port ', config.config.port);
