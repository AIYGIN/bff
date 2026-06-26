# Agent Rules

## 基本方針

このリポジトリは NestJS BFF。API 開発と共通基盤開発は Issue Driven +
Test Driven Development を前提に進める。

- API 完了条件: Swagger/OpenAPI で API 契約を表現できること。
- API 作業: Issue とコメントを読み、Controller mock または実装を draft PR にする。
- 基盤作業: 設定、DI、横断動作、機密情報保護、既存 API 非回帰を test で表現する。

## 必読

NestJS BFF の実装前に読む:

- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`
- `docs/agent-context-packet.md`
- `docs/layer-boundaries.md`

作業種別ごとの詳細は必要なものだけ読む:

- API mock: `.codex/workflows/api_controller_mock_flow.md`
- API implementation: `.codex/workflows/api_implementation_flow.md`
- Foundation: `.codex/workflows/foundation_implementation_flow.md`
- Agent roles: `.codex/agents/*.toml`

## CodeGraph

`.codegraph/` がある場合、コード理解・探索では grep/find や手読みより先に
CodeGraph を使う。

- 広い調査や流れ: `codegraph_explore`
- 単一 symbol/file: `codegraph_node`
- MCP がない場合: `codegraph explore "<question>"` / `codegraph node <target>`

## Shell

`rtk` が使える環境では shell command に prefix する。`rtk` が無い場合や raw
output が必要なデバッグ時は通常コマンドでよい。

## Sub-agent

サブエージェントを使う場合は token 使用量と終了理由を明確に管理する。

- 親エージェントは起動前に `docs/agent-context-packet.md` の Context Packet を作成し、Issue 本文・最新コメント・関連 diff・関連 docs から確定した事実だけを渡す。
- サブエージェントは Context Packet を主入力とし、`Must Read Files` を優先する。open-ended な repo 全体探索は禁止し、`Optional Files` は判断に必要な場合だけ読む。
- layer-boundary、OpenAPI schema exposure、security redaction、module wiring、既存 API 非回帰の確認に必要な限定的 repo-wide search は、目的・検索範囲・使用コマンドを明示した場合だけ許可する。
- Context Packet にない仕様を勝手に追加しない。不足情報は既存 JSON schema に Output Contract 共通 fields を追加し、`blocked` または `partial` として返す。
- 委譲した作業と同じ実装を親エージェントが並行して進めない。
- 長時間 running のままでも、ユーザー確認なしに close/shutdown しない。
- 止める前に、待機時間、最後に観測できた状態、終了しない理由として断定できる事実、不明点、継続/停止/親側引き継ぎの選択肢をユーザーへ説明する。
- `previous_status: "running"` を閉じた場合、終了理由は「親が close_agent したため」と明記し、サブエージェント内部エラーと断定しない。
- mock Issue では `mock_tester -> mock_implementer -> mock_reviewer` の完了状況を明示する。reviewer 未実施なら完了扱いしない。
- token 使用量が増える追加待機、追加サブエージェント起動、親側引き継ぎは、必要性を説明してから進める。

## Memory

タスク終了時、後で役立つ情報だけ agent-memory に保存する。

- `long_term`: 設計判断、運用方針、プロジェクト固有の決定
- `daily`: 実装メモ、調査結果、作業ログ
- `scratchpad`: 未完了 TODO

秘密情報、トークン、パスワード、認証情報、個人情報は保存しない。

ユーザーが「前回の続き」「再開」「続きから」「思い出して」と依頼したら、
作業前に scratchpad、直近日付の daily、関連 long_term を確認し、以下を短く報告する。

- 前回やっていたこと:
- 未完了 TODO:
- 今回最初にやること:

<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->
