test:
	@NODE_ENV=test ./node_modules/.bin/mocha --timeout 3000

.PHONY: test
