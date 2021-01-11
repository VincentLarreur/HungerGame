// Hunger Game socket API
"use strict";

const HungerGame = require('../hungergame/hungergame.js');

class SocketAPI {

    /**
     * Initialisation du socket API et de l'instance de jeu
     * @param {Number} port - port à écouter
     * @param {Number} nbRooms - nombre de rooms
     * @param {Number} tailleZone - taille de la zone de jeu
     * @param {Number} nbBonbons - nombre de bonbons
     */
    startService(port, nbRooms, tailleZone, nbBonbons) {
        var HungerGame = require('../hungergame/hungergame.js');
        var socket_io = require('socket.io')();

        // Initialisation de chaque room
        this.rooms = [];
        this.tailleZone = tailleZone;
        this.nbBonbons = nbBonbons;
        for (var i = 0; i < nbRooms; i++) {
            var room = {};
            room.id = i;

            // Creation de l'instance hunger game
            room.hungergame = new HungerGame(tailleZone[i], nbBonbons[i]);
            room.hungergame.setGameEventListener(this._gameEvent.bind(this));

            // Link de la réference de la room à la room
            room.hungergame.room = room;

            room.sockets = {};
            this.rooms.push(room);
        }

        // Initialisation socket.io
        socket_io.on('connection', this._onConnection.bind(this));
        socket_io.listen(port);
    }

    /**
     * Gere les nouvelles connexion
     * @param {socket} socket - socket instance
     */
    _onConnection(socket) {
        socket.started = false;

        // Liste de toutes les rooms
        socket.on('liste_room_client_server', function () {
            var liste = [];
            for (var roomID in this.rooms) {
                var sockets = this.rooms[roomID].sockets;
                liste.push({
                    id: roomID,
                    num_players: Object.keys(sockets).length,
                    nb_bonbons: this.nbBonbons[roomID],
                    taille: this.tailleZone[roomID]
                });
            }
            socket.emit('liste_room_server_client', liste);
        }.bind(this));

        // Debut - lorsque un joueur rejoint la partie
        socket.on('join', function (data) {
            // Si le socket est déjà demarré, ne rien faire
            if (socket.started) return;

            // Suppression de l'ancien socket si il existe
            this._removeSocket(socket);

            var roomID = data[0];
            var pseudo = data[1];

            // Si la room n'est pas reconnu, ne rien faire
            var room = this.rooms[roomID];
            if (typeof room === 'undefined') return;

            var hungergame = room.hungergame;
            var joueurID = hungergame.startJoueur(pseudo);

            // Assignation des informations du joueur
            socket.started = true;
            socket.roomID = roomID;
            socket.joueurID = joueurID;
            socket.pseudo = pseudo;

            // Ajout du socket dans le set et map au joueurID
            room.sockets[joueurID] = socket;

            // Reponse de début de partie au client
            socket.emit('debut', joueurID);
        }.bind(this));

        socket.on('monkey', function (data) {
            // Recherche de la room
            var roomID = socket.roomID;
            var room = this.rooms[roomID];
            if (typeof room === 'undefined') return;
            
            for(var i=0; i<data; i++) {
                room.hungergame.startMonkey();
            }
        }.bind(this));

        // keystroke - Lorsqu'un joueur appuie un input connu du systeme
        socket.on('keystroke', function (data) {
            // Deuxième vérification, de l'état du socket et du keystroke
            if (!socket.started) return;
            if (typeof data === 'undefined') return;

            // Recherche de la room
            var roomID = socket.roomID;
            var room = this.rooms[roomID];
            if (typeof room === 'undefined') return;

            // Envoi des données à la room
            room.hungergame.keyStroke(socket.joueurID, data);
        }.bind(this));

        // Déconnexion d'un joueur
        socket.on('disconnect', function () {
            this._removeSocket(socket);

            // Supprime le joueur si il est toujours vivant
            if (socket.started) {
                var room = this.rooms[socket.roomID];
                room.hungergame.suppressJoueur(socket.joueurID);
            }
        }.bind(this));
    }

    /**
     * Suppression du socket de toutes les structures.
     * @param {socket} socket - socket à supprimer
     */
    _removeSocket(socket) {
        if (typeof socket.joueurID === 'undefined') return;
        var room = this.rooms[socket.roomID];
        delete room.sockets[socket.joueurID];
    }

    /**
     * Gère les evenement du jeu
     * @param {HungerGame} hungergame - hungergame instance
     * @param {string} event - event name
     * @param data - event data
     */
    _gameEvent(hungergame, event, data) {
        var joueurID, room, socket;

        if (event == 'state') {
            // Envoi du state de la partie (chaque tick)
            for (joueurID in hungergame.room.sockets) {
                socket = hungergame.room.sockets[joueurID];
                socket.emit('state', data);
            }
        } else {
            // Suppression d'un joueur
            joueurID = (data[0] != undefined) ? data[0] : data;
            room = hungergame.room;
            socket = room.sockets[joueurID];
            if (typeof socket !== 'undefined') {
                if( event == 'joueur_mort' ) {
                    // Notification au client de sa mort
                    socket.emit('mort');
                    socket.started = false;
                } else if ( event == 'win' ) {
                    // Notification à tous les clients du gagnant
                    for (var k in room.sockets) {
                        var s = room.sockets[k];
                        s.emit('win', [joueurID, data[1], data[2]]);
                    }
                }
            }
        }
    }
}

module.exports = SocketAPI;
