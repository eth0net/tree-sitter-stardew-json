#!/usr/bin/env bash
# Regenerate the parser and run the corpus tests.
#
# src/parser.c is committed because consumers compile that file directly —
# Zed, for one, never runs `tree-sitter generate` — so a grammar.js change
# that was not regenerated would ship silently. CI runs this and then checks
# `git diff --exit-code`.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cli="$("$root/scripts/tree-sitter.sh")"

cd "$root"
"$cli" generate
"$cli" test "$@"
