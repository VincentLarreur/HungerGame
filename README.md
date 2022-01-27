<div align="center">

# Hunger Game
  
<img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white"/> <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101"/>

Un jeu HungerGame implémenté en fonction de l'énoncé du projet SR, ESIR 2020.

Mis en place en utilisant nodejs pour la partie serveur et socket.io pour la communication client/serveur.<br />
Déployé sur internet en utilisant une machine virtuelle Ubuntu de l'istic.

[Demo](#demo) •
[Image Docker](#image-docker) •
[Workflow](#workflow) •
[Auteurs](#auteurs) •
[Commandes](#commandes-du-projet)
</div>

## Demo 

Voir la version [démo](http://148.60.11.162:8000/) de Hunger Game !

## Image Docker 

L'image Docker est disponible [ici](https://hub.docker.com/repository/docker/vincentlarreur/hungergame/general).

## Rapport 

Voir le [rapport](https://docs.google.com/document/d/1ZdQjy_KrKsZRNxp86dYisYeUfszlGgCPhhkym1GT03s/edit?usp=sharing) concernant ce projet et son développement.

## WorkFlow

![alt text](./FlowHungerGame.jpg)

## Auteurs

Vincent Larreur & Mohamed Amine Laafoudi

## Commandes du projet

Construction de l'image Docker
```
make build
```
Lancement de l'application \
->(Paramètre SERVER_URI_PARAM afin de spécifier l'url)
```
make start
```
Exemple pour le déploiement sur vm de l'istic
```
make start SERVER_URI_PARAM="http://148.60.11.162:8000/"
```
Exemple pour le déploiement en local
```
make start SERVER_URI_PARAM="http://localhost:8080/"
```
Arrêt de l'application
```
make stop
```
Suppression de l'image docker
```
make clean
```
Rechargement de l'application
```
make reload
```
