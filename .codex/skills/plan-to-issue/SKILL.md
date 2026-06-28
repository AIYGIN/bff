---
name: plan-to-issue
description: BFFの開発計画をNestJS/API/基盤作業向けのGitHub Issue形式へ変換し、gh issue createで自動登録する。API mock、本実装、基盤変更のIssueを切るときに使用する。
---

# plan-to-issue

## 概要

このスキルは、プランモードで作成された開発計画を読み込み、BFFリポジトリのIssue Driven + Test Driven Developmentに沿ったGitHub Issueへ構造化し、自動登録する。

FEの `plan-to-issue` と同じく「実行可能なIssue」を作ることを優先するが、BFFではコンポーネント/Storeではなく、API契約、レイヤー責務、OpenAPI、TDD、基盤要件を中心に整理する。

---

## 参照ファイル

このスキルを実行する際は、以下を必ず読み込む。

- 変換ルール定義: `references/rules.md`
- 出力テンプレート: `assets/template.md`
- 登録スクリプト: `scripts/create_issue.sh`

作業種別に応じて、リポジトリ側の正本も読む。

- API mock: `.codex/workflows/api_controller_mock_flow.md`
- API implementation: `.codex/workflows/api_implementation_flow.md`
- Foundation: `.codex/workflows/foundation_implementation_flow.md`
- 共通ルール: `docs/layer-boundaries.md`, `docs/swagger-openapi-rules.md`, `docs/agent-context-packet.md`

---

## 入力

プランモードで作成された開発計画、またはユーザーがIssue化したい仕様・タスク・背景。

---

## 出力

GitHub Issue（`gh issue create` により自動登録）。

---

## 実行手順

### 1. 作業種別を分類する

開発計画を読み、Issue種別を次のいずれかに分類する。

- `api-mock`: Controller mock と Swagger/OpenAPI 契約を作るIssue
- `api-implementation`: 合意済みController mock/API契約を本実装へ置き換えるIssue
- `foundation`: 設定、DI、logging、error handling、HTTP client、認証共通部、CIなどの基盤Issue
- `docs` / `test` / `chore`: 上記に該当しない補助作業

分類に迷う場合は、API endpoint追加・公開契約が主目的なら `api-mock`、固定mockを外部API/Resource/Entityへ接続するなら `api-implementation`、横断機構なら `foundation` とする。

---

### 2. 必要な正本を読む

作業種別に応じた workflow と共通ルールを読み、Issue本文に反映する。

- API mockでは、DTO / docs decorator / Controller / 対応Service / module wiring / Controller test / OpenAPI e2e testを対象にする。
- API implementationでは、Service / Resource / Entity / DTO変換 / 外部API error mapping / module wiring / TDDを対象にする。
- Foundationでは、public interface / configuration / security / compatibility / failure behavior / test planを対象にする。

---

### 3. 開発計画を解析する

以下を分解して抽出する。

- 概要、背景、スコープ
- API契約またはpublic interface
- レイヤー別責務
- 追加・更新するtest
- セキュリティ/プライバシー制約
- 受け入れ条件
- Out of Scope / Assumptions / Blocking Questions

不明点は勝手に仕様追加せず、`補足・未確定事項` に「要確認」として明示する。security、公開契約、データ損失、破壊的migrationに関わる不明点は、Issue登録前にユーザーへ確認する。

---

### 4. テンプレートを適用する

`assets/template.md` に従い、次のplaceholderを置換する。

- `{{issue_type}}`
- `{{summary}}`
- `{{background}}`
- `{{scope}}`
- `{{api_contract_or_public_interface}}`
- `{{layer_design}}`
- `{{tasks}}`
- `{{acceptance_criteria}}`
- `{{test_plan}}`
- `{{security_and_compatibility}}`
- `{{notes}}`

---

### 5. タイトルを生成する

`references/rules.md` の命名規則に従い、以下の形式にする。

```text
<type>: <内容の要約>
```

例:

- `feat: ユーザー一覧APIのController mockを追加する`
- `feat: Todo一覧APIを外部Resourceへ接続する`
- `infra: request ID付きログ基盤を追加する`

---

### 6. Issueを登録する

`scripts/create_issue.sh` を利用する。

```bash
.codex/skills/plan-to-issue/scripts/create_issue.sh "<title>" "<body>"
```

登録後は必ず確認する。

```bash
gh issue view <issue-number> --json title,body,url
```

---

## 品質保証（必須チェック）

- tasksは抽象化されていないか
- 設計 → 実装 → テスト → 検証の順で復元できるか
- API契約またはpublic interfaceがIssue本文と受け入れ条件の両方に反映されているか
- レイヤー境界（Controller / Service / Resource / Entity / DTO）が明確か
- Swagger/OpenAPIで公開するものと公開しないものが明確か
- RED/GREENを含むTDD観点があるか
- security / privacy / compatibility の制約がある場合、受け入れ条件で検証できるか
- Out of Scope と未確定事項が明示されているか

---

## 禁止事項

- Issue本文にない仕様を推測だけで追加する
- EntityをSwagger/OpenAPI公開schemaとして扱うIssueにする
- ControllerにResource/Entity/HTTP client責務を持たせる計画にする
- ServiceにHTTP clientやSwagger decorator責務を持たせる計画にする
- ResourceにDTO / Controller / Service / Swagger decorator責務を持たせる計画にする
- `pnpm testを実行する` だけのテスト観点にする
