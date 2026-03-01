.PHONY: help install dev build db-migrate db-seed db-reset docker-up docker-down lint test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	npm install
	cd backend && npm install
	cd frontend && npm install

dev: ## Start development servers (requires PostgreSQL running)
	npm run dev

build: ## Build all applications
	npm run build

db-generate: ## Generate Prisma client
	cd backend && npx prisma generate

db-migrate: ## Run database migrations
	cd backend && npx prisma migrate dev

db-deploy: ## Deploy migrations to production
	cd backend && npx prisma migrate deploy

db-seed: ## Seed database with sample data
	cd backend && npx prisma db seed

db-studio: ## Open Prisma Studio
	cd backend && npx prisma studio

db-reset: ## Reset database (WARNING: deletes all data)
	cd backend && npx prisma migrate reset --force

docker-up: ## Start all services with Docker
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-build: ## Rebuild Docker images
	docker-compose up -d --build

lint: ## Run linting
	npm run lint

test: ## Run tests
	cd backend && npm test

clean: ## Clean build artifacts and node_modules
	rm -rf backend/dist frontend/.next
	rm -rf node_modules backend/node_modules frontend/node_modules
	rm -rf backend/uploads/*

setup: install db-generate db-migrate db-seed ## Initial project setup
