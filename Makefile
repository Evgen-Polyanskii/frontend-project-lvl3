install:
	npm ci

test:
	npm test

start-dev:
	npx webpack serve

build:
	npm run build

lint:
	npx eslint .

.PHONY: test
