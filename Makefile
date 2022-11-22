install:
	npm ci

start-dev:
	npx webpack serve

build:
	npm run build

lint:
	npx eslint .
