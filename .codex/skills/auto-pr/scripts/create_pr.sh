#!/usr/bin/env bash

set -euo pipefail

# Usage:
# .codex/skills/auto-pr/scripts/create_pr.sh "タイトル" "本文"

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

CURRENT_BRANCH=$(git branch --show-current)
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "現在のブランチを取得できません" >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  echo "main/master から直接PRは作成しません。作業ブランチに切り替えてください" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "未コミット変更があります。commit後にPRを作成してください" >&2
  git status --short
  exit 1
fi

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

printf "%s" "$BODY" > "$TMP_FILE"

echo "現在のブランチをpush中..."
git push -u origin HEAD

echo "Draft PRを作成中..."
gh pr create \
  --draft \
  --title "$TITLE" \
  --body-file "$TMP_FILE"

echo "PR作成完了"
