REPORTER = spec
test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER)

lib-cov:
	jscoverage lib lib-cov

test-cov:	lib-cov
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=html-cov 1> coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=json-cov 2> /dev/null | node coveralls.js
	rm -rf lib-cov

.PHONY: test
