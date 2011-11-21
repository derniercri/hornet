
ALL_TESTS = $(shell find test/ -name '*.test.js')

run-tests:
	@./node_modules/.bin/expresso \
		-t 3000 \
		-I lib \
		--serial \
		$(TESTFLAGS) \
		$(TESTS)

test:
	@$(MAKE) TESTS="$(ALL_TESTS)" run-tests

test-cov:
	@TESTFLAGS=--cov $(MAKE) test

.PHONY: test
