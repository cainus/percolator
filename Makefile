test:
	@NODE_ENV=test ./node_modules/.bin/mocha --timeout 9000

.PHONY: test
