# BFF Code Design Rules

## 目的

NestJS BFF のユースケース設計、非回帰、実装品質に関する共通ルールを定義する。

レイヤーの責務、依存方向、ディレクトリ、Auth helper、module 配置、Boundary test
の正本は `docs/layer-boundaries.md` とする。実装前に必ず参照する。

## BFF の責務

- Frontend 向けの API routing と公開 DTO を提供する。
- 外部 API / Platform / Provider API の差分を吸収する。
- 単一または複数 Resource の結果を Service で組み合わせる。
- Frontend に返す DTO を Service で確定する。
- 外部 API 疎通の詳細を Resource に閉じる。
- 公開 DTO と内部 Entity を分離する。

## 実装原則

- 既存 API response body と Swagger/OpenAPI 契約を維持する。
- Issue と最新コメントで合意された範囲だけを変更する。
- `any` で型エラーを回避しない。
- helper service や abstraction を必要以上に増やさない。
- secret / token / cookie / authorization / password をログや fixture に残さない。
- 既存差分を勝手に戻さない。

## Test

- Issue Driven + Test Driven Development を前提にする。
- 責務を移動した場合、同じ挙動を新しいレイヤーの test で維持する。
- private implementation detail だけを固定する brittle test を避ける。
- API 契約は OpenAPI e2e test で非回帰を確認する。
- レイヤー境界は `src/common/layer-boundaries.spec.ts` で確認する。
- テストを削除または弱めることで通さない。

## 完了条件

- `docs/layer-boundaries.md` に適合している。
- API response body と Swagger/OpenAPI 契約を理由なく変更していない。
- 実装、test、agent ドキュメントが同じルールを参照している。
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test --runInBand`
- `pnpm build`
