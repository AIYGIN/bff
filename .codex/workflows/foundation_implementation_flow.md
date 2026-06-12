# Foundation Implementation Flow

NestJS BFF の設定、logging、error handling、HTTP client、認証共通部、
observability、build、test、CI などの基盤変更は、Issue Driven + Test
Driven Development で進める。

API endpoint と Swagger/OpenAPI 公開契約の追加が主目的の場合は、
API Controller Mock Flow または API Implementation Flow を使う。

## 基本原則

- 人間が基盤 Issue の目的、変更範囲、public interface、test plan、
  acceptance criteria を定義する。
- エージェントは Issue 本文と最新コメントをもとに要求を確定する。
- 実装前に test を書く。
- 横断処理は DI 可能な module/provider として実装する。
- 環境変数の参照は型付き設定境界に閉じる。
- 既存 API response body と Swagger/OpenAPI 契約を維持する。
- request body、query、認証情報、secret、個人情報をログへ出さない。
- 運用時の失敗モードと起動時 validation を test する。

## フロー

1. Human: 基盤 Issue を作成し、必要に応じてコメントで補足する。
2. FoundationIssueResponder: Issue、コメント、関連コードを読み、実装可能性と
   リスクを確認する。
3. FoundationTester: unit / integration / e2e test を RED で追加する。
4. FoundationImplementer: 基盤 module/provider と wiring を最小実装する。
5. FoundationTester: test を GREEN にする。
6. FoundationReviewer: 非回帰、security、DI、運用性、TDD 記録を確認する。
7. FoundationIssueResponder: draft PR を作成し、Issue に PR リンクと実行ログを
   残す。

## 基盤 Issue に必要な項目

- Summary
- Motivation / current problem
- Implementation changes
- Public interfaces
- Configuration and defaults
- Security / privacy constraints
- Compatibility constraints
- Failure behavior
- Test plan
- Acceptance criteria
- Assumptions / out of scope

不足項目があってもコードと既存ルールから安全に確定できる場合は進める。
security、公開契約、データ損失、破壊的 migration に関わる不明点は質問して停止する。

## TDD の分担

- Unit test:
  - 設定の default、型変換、validation
  - logger field、Error 変換、redaction
  - helper、serializer、policy
- Integration test:
  - module import/export と provider injection
  - global provider、filter、guard、interceptor の登録
  - feature module から共通基盤を利用できること
- E2E test:
  - request ID、response header、access log
  - 4xx/5xx と未処理例外
  - body/query/認証情報が出力されないこと
  - 既存 response body と OpenAPI document の非回帰

## 完了条件

- Issue の acceptance criteria が test で検証されている。
- RED と GREEN の実行結果が記録されている。
- 設定不備が起動時に明確に失敗する。
- 横断処理が DI 可能で test から差し替えられる。
- secret、token、password、cookie、認証情報、個人情報がログに出ない。
- 既存 API response body と Swagger/OpenAPI 契約を意図せず変更していない。
- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm test:e2e --runInBand` が通る。
- `pnpm build` が通る。

## PR に書くこと

- 対象 Issue
- 確定した要求と public interface
- 設計判断と module/provider の責務
- security / privacy controls
- compatibility と API 契約への影響
- 追加・更新した tests
- RED/GREEN の実行ログ
- 実行コマンドと結果
- 残課題 / 後続 Issue 候補
