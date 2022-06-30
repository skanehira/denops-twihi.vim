.PHONY: init
init:
	@repo=$$(basename `git rev-parse --show-toplevel`) && repo=($${repo/-/ }) && repo=$${repo[1]/\.*/ } && mv denops/template denops/$${repo}

.PHONY: coverage
coverage: test-local
	@deno coverage cov
	@rm -rf cov

.PHONY: up-mock
up-mock:
	@deno run -A denops/twihi/mock/server.ts &

.PHONY: down-mock
down-mock:
	@lsof -i:8080 | tail -n 1 | awk '{print $$2}' | xargs kill -9

.PHONY: test-local
test-local: down-mock up-mock
	@DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		TEST_LOCAL=true \
		DENOPS_NAME=@denops-core-test \
		deno test -A --unstable

.PHONY: test-themis-nvim
test-themis-nvim:
	@TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		THEMIS_VIM=$$(which nvim) \
		themis --runtimepath $$GHQ_ROOT/github.com/vim-denops/denops.vim

.PHONY: test-themis-vim
test-themis-vim:
	@TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		themis --runtimepath $$GHQ_ROOT/github.com/vim-denops/denops.vim

.PHONY: test
test: up-mock
	@TWIHI_TEST_ENDPOINT=http://localhost:8080 deno test -A --unstable

.PHONY: deps
deps:
	@deno run -A https://deno.land/x/udd@0.7.3/main.ts denops/twihi/deps.ts
