.PHONY: init
init:
	@repo=$$(basename `git rev-parse --show-toplevel`) && repo=($${repo/-/ }) && repo=$${repo[1]/\.*/ } && mv denops/template denops/$${repo}

.PHONY: coverage
coverage: test-local
	@deno coverage cov
	@rm -rf cov

.PHONY: up-mock
up-mock:
	@deno run -A denops/twitter/mock/server.ts &

.PHONY: down-mock
down-mock:
	@lsof -i:8080 | tail -n 1 | awk '{print $$2}' | xargs kill -9

.PHONY: test-local
test-local: down-mock up-mock
	@DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		TEST_ENDPOINT=http://localhost:8080 \
		TEST_LOCAL=true \
		deno test -A --unstable

.PHONY: test
test: up-mock
	@TEST_ENDPOINT=http://localhost:8080 deno test -A --unstable

.PHONY: deps
deps:
	@deno run -A https://deno.land/x/udd@0.7.3/main.ts denops/twitter/deps.ts
