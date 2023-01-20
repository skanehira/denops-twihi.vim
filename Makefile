DENOPS := $${DENOPS_TEST_DENOPS_PATH:-$$GHQ_ROOT/github.com/vim-denops/denops.vim}
VIM := $${DENOPS_TEST_VIM_EXECUTABLE:-$$(which vim)}
NVIM := $${DENOPS_TEST_NVIM_EXECUTABLE:-$$(which nvim)}

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
	@DENOPS_TEST_DENOPS_PATH=$(DENOPS) \
		DENOPS_TEST_NVIM_EXECUTABLE=$(NVIM) \
		DENOPS_TEST_VIM_EXECUTABLE=$(VIM) \
		TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		TEST_LOCAL=true \
		deno test -A --unstable

.PHONY: test-themis
test-themis:
	@echo ==== test in Vim =====
	@TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		THEMIS_VIM=$(VIM) THEMIS_ARGS="-e -s -u DEFAULTS" themis --runtimepath $(DENOPS)
	@echo ==== test in Neovim =====
	@TWIHI_TEST_ENDPOINT=http://localhost:8080 \
		THEMIS_VIM=$(NVIM) THEMIS_ARGS="-e -s -u NONE" themis --runtimepath $(DENOPS)

.PHONY: test
test: up-mock
	@deno test -A --unstable

.PHONY: deps
deps:
	@deno run -A https://deno.land/x/udd@0.7.3/main.ts denops/twihi/deps.ts
	@deno run -A https://deno.land/x/udd@0.7.3/main.ts denops/twihi/deps_test.ts
