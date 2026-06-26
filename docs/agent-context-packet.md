# Agent Context Packet

Context Packet は、親エージェントがサブエージェントへ作業を渡す前に作成する標準入力である。
Issue 本文、最新コメント、関連 diff、関連 docs から確認できた事実だけを渡し、
サブエージェントに仕様の再解釈を任せないために使う。

サブエージェントは Context Packet を主入力として扱い、`Must Read Files` を優先して読む。
Context Packet にない仕様を勝手に追加しない。不足情報があれば既存 JSON schema に
Output Contract common fields を追加し、`status` を `blocked` または `partial` にして返す。

## Source And Facts

`Confirmed Requirements` には、親エージェントが Issue / PR / diff / docs から確定した
要件を書く。`Source References` には、その要件を確認した一次情報の出典を書く。
`facts` には、サブエージェントが作業中に追加で確認した事実を書く。
サブエージェントは `facts` に Context Packet の内容を丸写ししない。

## Context Packet Schema

````md
# Context Packet

## Task
- 対象作業:
- Issue / PR:
- 目的:

## Confirmed Requirements
- 確定した要件を書く。可能な限り各項目に source を付ける。
  - source: Issue #12 body

## Out of Scope
-

## Source References
- Issue:
- Latest comments:
- PR / diff:
- Docs:

## Must Read Files
- 原則最大8個まで
- 8個を超える場合は、なぜ必要かを Known Risks または Assumptions に明記する

## Optional Files
- 最大5個まで

## Relevant Rules
- 対象作業に必要なルールだけを書く
- 詳細 docs への参照を書く
- ルール全文の貼り付けは避ける

## Acceptance Criteria
-

## Known Risks
-

## Blocking Questions
- none または質問一覧

## Assumptions
-

## Output Contract
Output Contract は各 agent の既存 JSON schema を置き換えない。
各 agent は既存 JSON schema を維持したうえで、Context Packet 使用時は
以下の common fields を追加して返す。

{
  "status": "pass|blocked|partial|fail",
  "facts": [],
  "assumptions": [],
  "files_read": [],
  "risks": [],
  "commands": [],
  "test_results": "pass|fail|not_run with reason",
  "next_action": "..."
}

reviewer 系 agent は必要に応じて `files_reviewed` も追加する。
既存 schema にすでに `commands` / `test_results` がある agent では、既存 field を
Output Contract common field として扱い、重複定義しない。`files_changed` など
既存 schema にある fields は維持する。

`commands` には、サブエージェント自身が実行した検証コマンドを書く。
自分では実行せず、親エージェント、別サブエージェント、または CI の検証結果を参照した場合は、
`commands` には入れず、`facts` に参照元と確認した事実を書く。
実行していない場合は `commands` を空配列にし、`test_results` に
`not_run because ...` の形式で理由を書く。

```json
{
  "commands": ["pnpm test --runInBand"],
  "test_results": "pass"
}
```

```json
{
  "commands": [],
  "facts": ["CI result for pnpm test --runInBand was pass in PR #123"],
  "test_results": "not_run because CI result was referenced instead of running locally"
}
```

`test_results` には、検証結果を書く。実行した場合は pass/fail summary を書く。
実行していない場合は `not_run because ...` の形式で理由を書く。
````

## Repo-Wide Search

open-ended な repo 全体探索は禁止する。ただし、layer-boundary、OpenAPI schema
exposure、security redaction、module wiring、既存 API 非回帰の確認に必要な場合は、
目的・検索範囲・使用コマンドを Output Contract common fields に明記したうえで、
限定的な repo-wide search を許可する。

## Blocking Questions

security/privacy、auth/authorization、API contract/response compatibility、data loss、
destructive migration、external provider contract、financial calculation semantics、
logging of sensitive data、Cookie/JWT/CORS、public API response の変更、backward
compatibility に関わる不明点は `Blocking Questions` に入れる。それ以外の不明点は
`Assumptions` に明記して進める。

## Token Policy

- `Must Read Files` は原則最大8個、`Optional Files` は最大5個にする。
- `Must Read Files` が8個を超える場合は、なぜ必要かを Context Packet の
  `Known Risks` または `Assumptions` に明記する。
- サブエージェントの出力は既存 JSON schema と Output Contract common fields に沿って簡潔にする。
- 長い command output をそのまま貼らない。
- まず要約出力を確認し、失敗時だけ raw、verbose、json output を確認する。
- `git diff` は最初に stat または name-only を確認し、必要な path だけ詳細を見る。
- reviewer は原則 changed-files review に寄せる。
- 全体保証は layer-boundary test、OpenAPI e2e、unit test に寄せる。
- token 節約を理由に security、API 契約、data loss、migration に関わる確認を省略しない。
