#!/usr/bin/env bash
# Prints the path to the tree-sitter CLI, installing it first if need be.
#
# `npm install` alone is not enough: npm 12 blocks the package's install script
# unless it is allowlisted, and that script is what fetches the binary. Running
# it directly works under every npm, and it carries its own platform matrix —
# macOS, Linux and Windows — so there is nothing here to get wrong per-platform.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Matches install.js's own choice of name, so the cache check below doesn't miss
# an already-installed binary on Windows and reinstall on every run.
exe="$(node -p "process.platform === 'win32' ? '.exe' : ''")"
cli="$root/node_modules/tree-sitter-cli/tree-sitter$exe"

if [[ ! -x "$cli" ]]; then
    # `cd` rather than `npm --prefix`: given a Git Bash path, npm reads --prefix
    # as a local package to install and writes a self-dependency into
    # package.json.
    (cd "$root" && npm install --no-audit --no-fund --ignore-scripts >&2)
    # install.js writes the binary to the working directory, not to its own
    # package directory, so it has to run from there.
    (cd "$root/node_modules/tree-sitter-cli" && node install.js >&2)
fi

echo "$cli"
