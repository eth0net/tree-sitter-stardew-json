#!/usr/bin/env bash
# Prints the path to the tree-sitter CLI, installing it first if need be.
#
# `npm install` alone is not enough: npm 12 blocks the package's install script
# unless it is allowlisted, and that script is what fetches the binary. Running
# it directly works under every npm, and it carries its own platform matrix —
# macOS, Linux and Windows — so there is nothing here to get wrong per-platform.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cli="$root/node_modules/tree-sitter-cli/tree-sitter"

if [[ ! -x "$cli" ]]; then
    npm --prefix "$root" install --no-audit --no-fund --ignore-scripts >&2
    # install.js writes the binary to the working directory, not to its own
    # package directory, so it has to run from there.
    (cd "$root/node_modules/tree-sitter-cli" && node install.js >&2)
fi

echo "$cli"
