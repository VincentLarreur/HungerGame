// Hunger game - implementation des mécaniques de jeu
"use strict";
class HungerGame {
    /**
     * Initialisation de l'instance de jeu
     * @param {Number} taille_zone - Taille de la zone de jeu
     * @param {Number} nb_bonbons - Nombre de bonbons
     */
    constructor(taille_zone, nb_bonbons) {
        // Vérification des arguments
        this.tailleZone = (taille_zone<10 || taille_zone > 50) ? 10 : taille_zone;
        this.nb_bonbons = (nb_bonbons<5 || nb_bonbons > taille_zone) ? 10 : nb_bonbons;

        // Initialisation de la partie
        this.joueurs = [];
        this.prochainJoueurID = 1;

        this.zone = this._creationZone();
        // Spawn foods
        for (var i = 0; i < this.nb_bonbons; i++) this._spawnBonbons();
        this.nbBonbons = this.nb_bonbons;
        
        // Start updating
        this._startGameTimer();
    }

    /**
     * Spawns a food at random position on board.
     */
    _spawnBonbons() {
        var x = -1, y;
        while (x == -1 || this.zone[x][y] !== 0) {
            x = Math.floor((Math.random() * this.tailleZone));
            y = Math.floor((Math.random() * this.tailleZone));
        }
        this.zone[x][y] = -1;
    }

    /** ===========================================
     *             Fonctions publiques
     *  ===========================================
     */

    setGameEventListener(listener) {
        this._gameEventListener = listener;
    }

    /**
     * Création et démarrage pour un nouveau joueur
     * @param {String} pseudo - Pseudo du joueur
     */
    startJoueur(pseudo) {
        // Crée et ajoute le joueur
        var joueur = {
            id: this.prochainJoueurID,
            pseudo: pseudo,
            score: 0
        };
        this.joueurs[joueur.id] = joueur;
        this.prochainJoueurID++;

        // Spawn le joueur dans la zone de jeu
        this._spawnJoueur(joueur);
        return joueur.id;
    }

    /**
     * Suppression d'un joueur
     * @param {Number} joueurID - joueur ID
     */
    suppressJoueur(joueurID) {
        return this._supprimeJoueur(joueurID);
    }

    /**
     * Gère les key strokes (touches pressés) par les joueurs.
     * @param {Number} joueurID - joueur ID
     * @param {Object} data - data comprenant le Keycode
     */
    keyStroke(joueurID, data) {
        // Vérification data
        if (typeof data === 'undefined' ||
            typeof data.keycode === 'undefined') return false;

        var keyCode = data.keycode;

        keyCode = Number(keyCode);
        if (keyCode < 0 || keyCode >= 4) return false;

        // Vérification joueur
        var joueur = this.joueurs[joueurID];
        if (typeof joueur === 'undefined') return false;

        // Prévention de brusques changement de direction (2 en une frame)
        if (joueur.directionLock) return false;

        // Changement de direction
        joueur.direction = keyCode;

        // Vérouille la direction pour la frame en cours
        joueur.directionLock = true;
    }

    /** ===========================================
     *             Fonctions privées
     *  ===========================================
     */

    /**
     * Crée une zone de jeu, un tableau de tailleZonextailleZone (50x50 par exemple) remplie de 0
     */
    _creationZone() {
        var zone = new Array(this.tailleZone);
        for (var x = 0; x < this.tailleZone; x++) {
            zone[x] = new Array(this.tailleZone);
            for (var y = 0; y < this.tailleZone; y++) {
                zone[x][y] = 0;
            }
        }
        return zone;
    }

    /**
     * Spawn le joueur dans la zone
     * @param {Number} joueur - joueur
     */
    _spawnJoueur(joueur) {
        // Coordonées aléatoires
        var x = Math.floor((Math.random() * (this.tailleZone - 10)));
        var y = Math.floor((Math.random() * this.tailleZone));

        if (this.zone[x][y] == 0) {
            // Spawn le joueur aux coordonnées choisis
            joueur.position = [x, y];
            this.zone[x][y] = joueur.id;
        } else {
            this._spawnJoueur(joueur);
        }
        
    }

     /**
     * Remise à zero du joueur
     */
    _reset(joueur) {
        joueur.score = 0;
        joueur.direction = -1;
        this.zone[joueur.position[0]][joueur.position[1]] = 0;
        this._spawnJoueur(joueur);
    }

    /**
     * Update la progression du joueur pour une frame
     * @param {Object} joueur - joueur
     */
    _updateJoueur(joueur) {
        // Release direction lock
        joueur.directionLock = false;

        this.zone[joueur.position[0]][joueur.position[1]] = 0;

        // Genere la nouvelle position
        var nouvellePosition = this._prochainePosition(joueur.position, joueur.direction);

        // Récupération de l'objet en face du joueur
        var tmp_object = this.zone[nouvellePosition[0]][nouvellePosition[1]];

        // Gestion collision
        if (tmp_object > 0) {
            // Collision avec un autre joueurs
            // Les deux meurent
            this._supprimeJoueur(joueur.id);
            this._supprimeJoueur(tmp_object);
            return;
        } else if (tmp_object == -1) {
            // Mange le bonbon, augmente son score
            joueur.score++;
            this.nbBonbons--;
        }

        // Update position
        this.zone[nouvellePosition[0]][nouvellePosition[1]] = joueur.id;
        joueur.position = nouvellePosition;
        // Ne bouger que lors des inputs du joueur
        //joueur.direction = -1;
    }

    /**
     * Supprime un joueur
     * @param {Number} joueurID - joueur ID
     */
    _supprimeJoueur(joueurID) {
        var joueur = this.joueurs[joueurID];
        if (typeof joueur === 'undefined') return false;

        this.zone[joueur.position[0]][joueur.position[1]] = 0;        

        // Supprime l'objet joueur de la liste des joueurs
        delete this.joueurs[joueurID];
        
        // Broadcast event
        if (typeof this._gameEventListener !== 'undefined')
            this._gameEventListener(this, 'joueur_mort', joueurID);
    }

    /**
     * Calcule la prochaine position avec la position et une direction.
     * @param {Array} position - position actuelle, [x, y]
     * @param {Number} direction - direction du joueur
     */
    _prochainePosition(position, direction) {
        if (typeof direction === 'undefined') direction = -1;

        var x = position[0];
        var y = position[1];
        var directionX = 0, directionY = -1;
        switch (direction) {
            case 0:
                directionX = 0; directionY = -1;
              break;
            case 1:
                directionX = -1; directionY = 0;
              break;
            case 2:
                directionX = 0; directionY = 1;
              break;
            case 3:
                directionX = 1; directionY = 0;
              break;
            default:
                directionX = 0; directionY = 0;
            break;
        }
        return [(x + directionX + this.tailleZone) % this.tailleZone,
                (y + directionY + this.tailleZone) % this.tailleZone];
    }

    /**
     * Démarre le timer du jeu
     */
    _startGameTimer() {
        this._stopGameTimer();
        this.gameTimer = setInterval(this._gameTimerEvent.bind(this), 150); // Vitesse de jeu
    }

    /**
     * Arrete le timer de jeu
     */
    _stopGameTimer() {
        if (typeof this.gameTimer !== 'undefined')
            clearInterval(this.gameTimer);
    }

    /**
     * Met à jour et envoi de l'état de la partie
     */
    _gameTimerEvent() {
        this._nextFrame();
        this._sendGameState();
    }

    /**
     * Envoi de l'état de la partie
     */
    _sendGameState() {
        if (typeof this._gameEventListener !== 'undefined') {
            var payload = {joueurs: this.joueurs, zone: this.zone};
            this._gameEventListener(this, 'state', payload);
        }
    }

    /**
     * Genere le prochain état de tous les joueurs
     */
    _nextFrame() {
        // Update l'avancée de chaque joueurs
        for (var joueurID in this.joueurs) {
            var joueur = this.joueurs[joueurID];
            this._updateJoueur(joueur);
        }
        this._checkEnd();
    }

    /**
     * Vérification de l'état de la partie, si il n'y a plus de bonbons : respawn des nouveaux et reset des joueurs
     * Et envoi au client le nom du winner
     */
    _checkEnd() {
        if(this.nbBonbons === 0) {
            var classement = this.joueurs.filter(function (e) {
                return e != null;
            });
            classement.sort((a,b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
            var gagnant  = classement[0];
            // Envoi du gagnant aux client
            if (typeof this._gameEventListener !== 'undefined')
                this._gameEventListener(this, 'win', [gagnant.id, gagnant.pseudo, gagnant.score]);
            // Respawn des bonbons
            for (var i = 0; i < this.nb_bonbons; i++) this._spawnBonbons();
            this.nbBonbons = this.nb_bonbons;
            // Respawn des joueurs
            for (var joueurID in this.joueurs) {
                var joueur = this.joueurs[joueurID];
                this._reset(joueur);
            }
        }
    }
}

module.exports = HungerGame;
