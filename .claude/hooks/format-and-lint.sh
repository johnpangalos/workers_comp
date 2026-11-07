#!/usr/bin/env bash
# PostToolUse hook: format the file Claude just edited with oxfmt, then lint it with oxlint
# (fixing what it can, such as class order). Lint errors that are left go back to Claude
# (exit 2), so they get fixed while the change is being made rather than in CI.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] && [ -f "$file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

pnpm exec oxfmt --no-error-on-unmatched-pattern "$file" > /dev/null 2>&1

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs) ;;
  *) exit 0 ;;
esac

if ! out=$(pnpm exec oxlint --fix "$file" 2>&1); then
  echo "oxlint found problems in $file:" >&2
  echo "$out" >&2
  exit 2
fi
