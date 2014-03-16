TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =

install-test:
	@NODE_ENV=test npm install

test: install-test
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov: install-test
	@$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=html-cov | ./node_modules/.bin/cov

cov: test-cov

test-all: test test-cov

.PHONY: test
