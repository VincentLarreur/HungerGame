_END   := $(shell tput -Txterm sgr0)
_UNDER := $(shell tput -Txterm smul)
_GREEN  := $(shell tput -Txterm setaf 2)

SERVER_URI_PARAM?="http://localhost:8000"

define _PRINT
	@echo "$(_GREEN)$(_UNDER)$(1)$(_END)"
endef

build:
	$(call _PRINT,Construction de l'image Docker)
	docker build --tag hungergame . 

start:
	$(call _PRINT,Lancement de l'application)
	docker run -i --rm --publish 8000:8000 -e SERVER_URI=$(SERVER_URI_PARAM) --detach --name hg hungergame

stop:
	$(call _PRINT,Arret de l'application)
	docker rm -f hg

clean:
	$(call _PRINT,Suppression de l'image docker)
	docker rmi $$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'hungergame') --force

reload:
	make stop
	make clean
	make build
	make start