_END   := $(shell tput -Txterm sgr0)
_UNDER := $(shell tput -Txterm smul)
_GREEN  := $(shell tput -Txterm setaf 2)

define _PRINT
	@echo "$(_GREEN)$(_UNDER)$(1)$(_END)"
endef

build:
	$(call _PRINT,Construction de l'image Docker)
	docker build --tag hungergame:0.1 . 

start:
	$(call _PRINT,Lancement de l'application)
	docker run -i --rm --publish 8000:8000 --detach --name hg hungergame:0.1

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