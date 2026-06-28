---
name: auto-pr
description: 直前のコミット内容とBFFのIssue Driven/TDDルールをもとにPRタイトルと本文を生成し、GitHubのdraft PRとして自動登録する
---

# auto-pr

## 概要

このスキルは、直前のコミット内容、差分、関連Issue、BFF workflowの完了条件をもとにPRタイトルと本文を生成し、GitHubへdraft PRを登録する。

FEの `auto-pr` と同じく、diffに現れた事実だけをPR本文へ書く。ただしBFFでは、対象Issue、API契約/Public Interface、レイヤー境界、TDDログ、Swagger/OpenAPI確認、security/compatibilityを明示する。

---

## 参照ファイル

このスキルを実行する際は、以下を必ず読み込む。

- PRテンプレート: `assets/template.md`
- PR作成スクリプト: `scripts/create_pr.sh`

必要に応じて、作業種別に対応するworkflowも読む。

- API mock: `.codex/workflows/api_controller_mock_flow.md`
- API implementation: `.codex/workflows/api_implementation_flow.md`
- Foundation: `.codex/workflows/foundation_implementation_flow.md`

---

## 入力

直前のコミット情報、差分、現在ブランチ、関連Issue番号、実行済みテスト結果。

---

## 出力

GitHubのdraft PR（`gh pr create --draft` により自動登録）。

---

## 実行手順

### 1. 前提確認

```bash
git status --short --branch
gh auth status
gh repo view --json nameWithOwner,url
```

- 未コミット変更がある場合はPR作成を停止する。
- main / master上で作業している場合はPR作成を停止する。
- gh未認証の場合は停止する。

---

### 2. 直前のコミット情報と変更内容を取得する

```bash
git log -1 --pretty=format:"%h%n%s%n%b"
git show --no-color --stat
git show --no-color
```

- `git log`: 意図、タイトル、背景
- `git show --stat`: 変更ファイルと規模
- `git show`: 実際のdiff

関連Issueがブランチ名、コミット本文、ユーザー入力から分かる場合は取得する。

```bash
gh issue view <issue-number> --json title,body,url,comments
```

---

### 3. 解析してPR本文要素を生成する

以下を生成する。

- `related_issue`: 対象Issueまたはなし
- `summary`: 概要
- `background`: 背景・目的
- `implementation`: 実装内容（diffに現れた変更のみ）
- `api_or_public_interface`: API契約 / Public Interfaceへの影響
- `layer_boundary`: Controller / Service / Resource / Entity / DTO / module wiringへの影響
- `tests`: 実行済みテスト・確認済み挙動
- `security_compatibility`: security / privacy / compatibilityへの影響
- `red_green_log`: RED/GREENログ。確認できない場合は「未確認」
- `impact`: 影響範囲
- `future_work`: 未対応・今後の課題。diffやIssueから明確な場合のみ

---

### 4. PR本文を生成する

`assets/template.md` を読み込み、placeholderを置換する。

- `{{related_issue}}`
- `{{summary}}`
- `{{background}}`
- `{{implementation}}`
- `{{api_or_public_interface}}`
- `{{layer_boundary}}`
- `{{tests}}`
- `{{security_compatibility}}`
- `{{red_green_log}}`
- `{{impact}}`
- `{{future_work}}`

---

### 5. PRタイトルを生成する

フォーマット:

```text
<type>: <summaryの短縮版>
```

例:

- `feat: Todo一覧APIのController mockを追加する`
- `feat: Todo一覧APIをResource実装へ接続する`
- `infra: request ID付きログ基盤を追加する`

`type` は既存コミットまたは差分に合わせる。

---

### 6. ブランチをpushしてdraft PRを作成する

```bash
git push -u origin HEAD
.codex/skills/auto-pr/scripts/create_pr.sh "<title>" "<body>"
```

作成後は必ず確認する。

```bash
gh pr view --json title,body,url,isDraft,headRefName,baseRefName
```

---

## 補足ルール（重要）

### implementation

- diffに実際に現れた変更のみを書く
- 推測は禁止
- ファイル名、レイヤー名、責務変更を具体的に書く

### api_or_public_interface

- OpenAPI/Swagger契約、endpoint、DTO、configuration、module exportなどの公開面だけを書く
- 影響なしの場合は `なし` と書く
- EntityをOpenAPI公開schemaとして書かない

### layer_boundary

- Controller / Service / Resource / Entity / DTO / Moduleのどこが変わったかを書く
- レイヤー境界が未確認なら「未確認」と書く

### tests

- 実行したコマンドと結果を書く
- ただしチェックリストには「コマンド実行」だけでなく、確認できた振る舞いを書く
- 実行していない場合は `未実行` と明記し、実行したかのように書かない

### red_green_log

- RED/GREENを観測した場合のみ書く
- REDを取っていない場合は「RED未確認」と明記する

### future_work

- diff、Issue、コメントから明確に未対応と分かる場合のみ書く
- 推測や一般論は禁止
- 該当がない場合は `なし`

---

## 全体ルール

- PRはdraftで作成する
- implementation / impact / future_work は箇条書き
- tests はチェックリスト形式を含める
- PR本文はdiff、Issue、実行ログを根拠にする
- pushまたはPR作成に失敗した場合は中断し、成功したかのように報告しない
