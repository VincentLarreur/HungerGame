// Hunger Game client

/**
 * Initialisation du Client de jeu
 */
function HGClient() {

  // Récupération des DOM elements
  this.div_settings    = $('#div_settings');
  this.txt_player_name = $('#txt_player_name');
  this.tbody_rooms     = $('#tbody_rooms');
  this.canvas_board    = $('#canvas_board');
  this.ctx_board       = $('#canvas_board')[0].getContext('2d');
  this.div_scores      = $('#div_scores');
  this.panel_scores    = $('#panel_scores');
  this.div_restart     = $('#div_restart');

  // Variables 
  this.couleurs = ['#2196F3', '#FF5722', '#607D8B', '#E91E63'];
  this.keyMap = {37: 0, 38: 1, 39: 2, 40: 3, 81: 0, 90: 1, 68: 2, 83: 3};
  this.started = false;

  // Init socket.io
  this.initSocket();

  // Keystroke handler
  document.onkeydown = function(e) {
      e = e || window.event;

      // Si le jeu n'est pas démarré, ne rien faire
      if (!this.started) return;

      // Si la keystroke n'est pas reconnu, ne rien faire
      var keyCode = this.keyMap[e.keyCode];
      if (typeof keyCode === 'undefined') return;

      // Sinon, envoi du keystroke au serveur
      this.socket.emit('keystroke', {keycode: keyCode});
  }.bind(this);
}

/**
 * Initialisation de socket.io.
 */
HGClient.prototype.initSocket = function() {

  // Variable pour la connexion
  var server_uri = 'http://localhost:8000';
  var socket_io_path = '/socket.io';
  var socket = io(server_uri, { path: socket_io_path, reconnectionAttempts: 3 });

  this.socket = socket;

  // Lorsque socket connecté, requete de la liste des rooms
  socket.on('connect', function() {
    socket.emit('liste_room_client_server');
  }.bind(this));

  // lorsque liste des rooms reçu, affichage dans la table
  socket.on('liste_room_server_client', function(data) {
    // Reinitialisation de la table
    this.tbody_rooms.empty();

    // Gestion de la liste, création des lignes correspondantes dans la table
    var list = data;
    for (var i in list) {
      var room = list[i];
      var ligne = '<tr>';
      ligne += '<td>' + room.id + '</td>';
      ligne += '<td>' + room.num_players + '</td>';
      ligne += '<td>' + room.taille + 'x' + room.taille + '</td>';
      ligne += '<td>' + room.nb_bonbons + '</td>';
      ligne += '<td><a onclick="client.startGame(' + room.id + ');">Rejoindre</a></td>';
      this.tbody_rooms.append(ligne);
    }
  }.bind(this));

  // Lorsque la partie est commencé
  socket.on('debut', function(data) {
    this.playerID = data;

    // Mise à jour de l'écran pour afficher la zone de jeu et les scores
    this.div_settings.hide();
    this.div_restart.hide();
    this.div_scores.show();
    this.canvas_board.show();

    // Enregistrer l'état de jeu
    this.started = true;
  }.bind(this));

  // Le joueur meurt
  socket.on('mort', function() {
    // Affichage de la div pour restart
    this.div_restart.show();
  }.bind(this));

  // Mise à jour du state
  socket.on('state', function(data) {
    this.updateScorePanel(data.joueurs);
    this.renderBoard(data.zone);
  }.bind(this));
};

/**
 * Début de la partie
 * @param {Number} roomID - ID de la room
 */
HGClient.prototype.startGame = function(roomID) {
  // Récuperation du pseudo
  if (typeof this.pseudoJoueur === 'undefined')
    this.pseudoJoueur = this.txt_player_name.val();

  // Si l'input est vide, pseudo : Guest
  if (this.pseudoJoueur.length <= 0)
    this.pseudoJoueur = 'Guest';

  // Envoi de la notification de début de la partie de ce joueur au serveur
  this.roomID = roomID;
  this.socket.emit('join', [roomID, this.pseudoJoueur]);
};

/**
 * Reprendre la partie = commencer la partie
 */
HGClient.prototype.restartGame = function() {
  this.startGame(this.roomID);
};

/**
 * Récupération d'une couleur pour le joueur en fonction de son ID joueur
 * @param {Number} joueurID - ID du joueur
 */
HGClient.prototype.couleurJoueur = function(joueurID) {
  return this.couleurs[joueurID % this.couleurs.length];
};

/**
 * Rendu du board sur le canva
 * @param {Number[][]} zone - zone de jeu
 */
HGClient.prototype.renderBoard = function(zone) {
  // horizontal
  for(var x = 0; x < zone.length; x++) {
    //vertical
    for(var y = 0; y < zone.length; y++) {
      var caseID = zone[x][y];

      // Couleur de base
      var couleur = '#DDD';
      // Si l'id est un joueur on récupere sa couleur
      if (caseID > 0) {
        couleur = this.couleurJoueur(caseID);
      } else if (caseID < 0) { // Sinon, couleur bonbon
        couleur = '#555';
      }

      // Remplissage du board avec la couleur
      this.ctx_board.fillStyle = couleur;
      // calcul de la taille des carrés
      var size = 500/zone.length;
      // Remplissage des réctangle
      this.ctx_board.fillRect(y * size, x * size, size-1, size-1);
    }
  }
};

/**
 * Mise a jour du paneau des scores
 * @param {Object} joueurs - Joueurs dans le tableau des scores avec leur pseudo et
 */
HGClient.prototype.updateScorePanel = function(joueurs) {
  //sort joueurs
  var classement = joueurs.filter(function (e) {
    return e != null;
  });
  classement.sort((a,b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
  var text = '';
  for (var i = 0; i < classement.length; i++) {
    if(classement[i] !== null)
      text += '<span class="badge" style="background-color:'
        + this.couleurJoueur(classement[i].id)
        + ';">'+ (i+1) +'</span> ' 
        + classement[i].pseudo 
        + ' - '
        + classement[i].score
        + '<br>';
  }
  this.panel_scores.html(text);
};
