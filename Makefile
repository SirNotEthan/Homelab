.PHONY: help validate bootstrap cluster homepage monitoring backup

VERSION := $(shell cat VERSION)

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "; printf "Homelab %s\n\n", "$(VERSION)"} /^[a-zA-Z_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

validate: ## Validate foundational repository files
	@test -s VERSION
	@grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$$' VERSION
	@test -f README.md
	@test -f CHANGELOG.md
	@test -f docs/architecture.md
	@test -f docs/disaster-recovery.md
	@echo "Repository foundation is valid (v$(VERSION))."

bootstrap: ## Bootstrap a host (not implemented)
	@echo "Bootstrap automation has not been implemented yet."
	@exit 1

cluster: ## Deploy the k3s cluster (not implemented)
	@echo "Cluster automation has not been implemented yet."
	@exit 1

homepage: ## Deploy Homepage configuration (not implemented)
	@echo "Homepage deployment has not been implemented yet."
	@exit 1

monitoring: ## Deploy monitoring configuration (not implemented)
	@echo "Monitoring deployment has not been implemented yet."
	@exit 1

backup: ## Run configured backups (not implemented)
	@echo "Backup automation has not been implemented yet."
	@exit 1
