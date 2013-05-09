REPORTER = spec
test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER) --recursive

lib-cov:
	./node_modules/jscoverage/bin/jscoverage lib lib-cov

test-cov:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=html-cov 1> coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	$(MAKE) test REPORTER=spec
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js || true
	rm -rf lib-cov

.PHONY: test
