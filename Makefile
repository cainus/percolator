REPORTER = spec
test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER) --recursive

lint:
	./node_modules/.bin/jshint ./test ./index.js

lib-cov:
	./node_modules/jscoverage/bin/jscoverage lib lib-cov

test-cov:
	$(MAKE) lint
	./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha -- -b --reporter $(REPORTER) --check-leaks
	echo "See reports at ./coverage/lcov-report/index.html"

test-coveralls:	lib-cov
	$(MAKE) test REPORTER=spec
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@PERCOLATOR_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js || true
	rm -rf lib-cov


.PHONY: test
