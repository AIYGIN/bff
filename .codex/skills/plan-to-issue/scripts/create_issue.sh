#!/usr/bin/env bash

set -euo pipefail

# Usage:
# .codex/skills/plan-to-issue/scripts/create_issue.sh "タイトル" "本文"

TITLE="${1:-}"
BODY="${2:-}"

if [[ -z "$TITLE" || -z "$BODY" ]]; then
  echo "Usage: $0 \"タイトル\" \"本文\"" >&2
  exit 1
fi

if ! command -v gh > /dev/null 2>&1; then
  echo "gh コマンドが見つかりません" >&2
  exit 1
fi

if ! gh auth status > /dev/null 2>&1; then
  echo "GitHubにログインしていません" >&2
  echo "gh auth login を実行してください" >&2
  exit 1
fi

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

printf "%s" "$BODY" > "$TMP_FILE"

echo "Issueを作成中..."
gh issue create \
  --title "$TITLE" \
  --body-file "$TMP_FILE"

echo "Issue作成完了"
