REPORTER = spec
t:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER)

lib-cov:
	jscoverage lib lib-cov

test-cov:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=html-cov 1> coverage.html
	rm -rf lib-cov

test:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=json-cov 2> /dev/null | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

.PHONY: test
