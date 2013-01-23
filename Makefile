
REPORTER = spec

test:
	@./node_modules/.bin/mocha \
	  --slow 30 \
	  --reporter $(REPORTER) \
	  --ignore-leaks

.PHONY: test