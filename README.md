<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Frontend 向け NestJS BFF。

## Project setup

```bash
pnpm install
cp .env.example .env
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3001` | HTTP listen port (`1` to `65535`) |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated HTTP(S) origins |
| `LOG_LEVEL` | `debug` in development/test, `info` in production | Pino log level |
| `ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` | `.data/enterprises/unified-dividend-analysis.csv` | 高配当分析APIが読むgenerated unified CSV |
| `ENTERPRISE_DIVIDEND_RAW_DIR` | `private-data/enterprises/raw` | batchが候補リストなどのraw/debug用ファイルを書き出すprivate directory |
| `ENTERPRISE_DIVIDEND_SCORE_VERSION` | `dividend-score-v1` | generated unified CSVに出力するscore version |
| `ENTERPRISE_DATA_FETCH_TIMEOUT_MS` | `10000` | J-Quants / EDINET / candidate fetchのtimeout |
| `JQUANTS_API_BASE_URL` | `https://api.jquants.com` | J-Quants API base URL |
| `JQUANTS_ID_TOKEN` | empty | J-Quants API access token。Git管理しない |
| `EDINET_API_BASE_URL` | `https://disclosure2.edinet-fsa.go.jp/api/v2` | EDINET API base URL |
| `EDINET_API_KEY` | empty | EDINET API key。Git管理しない |
| `HIGH_DIVIDEND_CANDIDATE_URL` | empty | 高配当候補リストを取得するremote URL。未設定または取得失敗時はcandidate CSV fallback |
| `HIGH_DIVIDEND_CANDIDATE_CSV_PATH` | `private-data/enterprises/high-dividend-candidates.csv` | high dividend candidate fetcherのfallback CSV |

Environment values are validated during application startup. Logs are emitted
as JSON to stdout. Access logs include a request ID, method, query-free path,
status, duration, IP address, and user agent. Request bodies, query values, and
authentication headers are not included.

Detailed design and operational guarantees are documented in
[`docs/configuration-logging-foundation.md`](docs/configuration-logging-foundation.md).

## 高配当分析CSVの運用

高配当分析APIは、画面リクエスト中にJ-Quants / EDINETへ同期アクセスしません。
通常APIは `ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` のgenerated unified CSVだけを読みます。
外部データ取得とCSV生成は、明示的にmanual batchとして実行します。

### 使うファイル

| File / directory | Git管理 | 用途 |
| --- | --- | --- |
| `.data/enterprises/unified-dividend-analysis.csv` | しない | BFF APIが読むgenerated unified CSVのdefault出力先 |
| `private-data/enterprises/high-dividend-candidates.csv` | しない | remote候補取得に失敗した場合のfallback候補CSV |
| `private-data/enterprises/raw/` | しない | batchが候補リストなどのraw/debug用ファイルを書き出す場所 |
| `test/fixtures/enterprises/*.csv` | する | unit/e2e test用の小さいfixture。実データやsecretは入れない |

`.data/` と `private-data/` は `.gitignore` 対象です。実データCSV、API key、
raw dump、private pathをcommitしないでください。

### 初回準備

`.env` に必要な設定を入れます。

```bash
cp .env.example .env
```

最低限、実データ更新を行う環境では次を設定します。

```env
ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH=.data/enterprises/unified-dividend-analysis.csv
ENTERPRISE_DIVIDEND_RAW_DIR=private-data/enterprises/raw
HIGH_DIVIDEND_CANDIDATE_CSV_PATH=private-data/enterprises/high-dividend-candidates.csv
JQUANTS_ID_TOKEN=...
EDINET_API_KEY=...
```

`HIGH_DIVIDEND_CANDIDATE_URL` を設定するとremote候補リストを取得します。未設定、
またはremote取得に失敗した場合は `HIGH_DIVIDEND_CANDIDATE_CSV_PATH` を読みます。
fallback CSVは、4桁証券コードを含む行であれば読み取れます。

例:

```csv
symbolId
2914
8306
9432
```

### ユーザーの入力操作

実データ更新時に人間が直接入力・編集するのは、次の3種類です。

1. `.env` にcredentialと入出力pathを入力する。
2. 必要に応じてfallback候補CSVに4桁証券コードを入力する。
3. batch生成後のgenerated unified CSVを確認し、TODO理由が残った列だけ補完する。

#### 1. `.env` を編集する

`.env.example` をコピーしたあと、エディタで `.env` を開きます。

```bash
cp .env.example .env
```

入力する値:

```env
JQUANTS_ID_TOKEN=<J-QuantsのID token>
EDINET_API_KEY=<EDINET API key>
ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH=.data/enterprises/unified-dividend-analysis.csv
ENTERPRISE_DIVIDEND_RAW_DIR=private-data/enterprises/raw
HIGH_DIVIDEND_CANDIDATE_CSV_PATH=private-data/enterprises/high-dividend-candidates.csv
```

remoteの候補リストを使う場合だけ、次も入力します。

```env
HIGH_DIVIDEND_CANDIDATE_URL=<候補リストCSVまたはページのURL>
```

#### 2. fallback候補CSVを入力する

`HIGH_DIVIDEND_CANDIDATE_URL` を使わない場合、またはremote取得に失敗した場合に備えて、
`private-data/enterprises/high-dividend-candidates.csv` を作ります。

```csv
symbolId
2914
8306
9432
```

入力ルール:

- 4桁証券コードを1行に1つ入れる。
- headerは `symbolId` にする。
- 上から順に候補順位として扱う。
- 50件を超える場合、batchは上位50件だけ使う。

#### 3. batch生成後のCSVを確認・補完する

batch実行後、`ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` のCSVをエディタや表計算ソフトで開きます。

確認する列:

| Column | ユーザー操作 |
| --- | --- |
| `missingFields` | 欠損している項目名を確認する |
| `warnings` | `manual_review_required` などの警告を確認する |
| `notAvailableReason` | TODO理由を確認し、人間判断が必要な項目を補完する |
| `companyName` | `TODO:企業名要確認` の場合は正式名称へ直す |
| `dividendYield` | `0` かつ `missingFields` に含まれる場合は確認済みの値へ直す |
| `freeCashFlow` | EDINET抽出失敗時は確認済みの値を入れる。金融業でN/Aなら空欄のまま |
| `freeCashFlowStatus` | `AVAILABLE` / `NOT_APPLICABLE` / `MISSING` のいずれかにする |

補完後は、同じファイルパスに保存します。ファイル名や保存先を変えた場合は、
`.env` の `ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` も同じpathへ変更してください。

### 更新手順

1. J-Quants / EDINET のcredentialを `.env` に設定する。
2. 必要なら `private-data/enterprises/high-dividend-candidates.csv` を用意する。
3. batchを実行する。
4. generated unified CSVの `missingFields` / `warnings` / `notAvailableReason` を確認する。
5. TODO理由が残っている列だけ補完し、同じCSVへ保存する。
6. BFFを起動し、APIレスポンスに反映されることを確認する。

```bash
pnpm update-csv
```

成功すると、`ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` にgenerated unified CSVが作られます。
APIは次回リクエスト時にこのCSVを読み、`GET /enterprises/quantsInfo` と
`GET /enterprises/{symbolId}/dividendAnalysis` のレスポンスへ反映します。

反映確認:

```bash
pnpm start:dev
```

別terminalで、認証Cookieを付けてAPIを確認します。

```bash
curl -H "Cookie: access_token=<token>" \
  "http://localhost:3001/enterprises/quantsInfo?limit=5"
```

### generated unified CSVの扱い

generated unified CSVには、公開APIで使う列に加えて、運用確認用の
`notAvailableReason` 列が含まれます。この列はCSV内部メタデータであり、
公開API response / OpenAPI schemaには出しません。

自動取得できない項目がある場合、batchは `missingFields`、`warnings`、
`notAvailableReason` に理由を残します。人間はCSVのTODO理由を確認し、必要な値を補完してから
同じCSVを `ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH` に置きます。

### 注意点

- `pnpm start` / 通常APIリクエストはJ-Quants / EDINETを呼びません。
- `pnpm update-csv` だけが外部Providerへアクセスします。
- API key、raw payload、private file pathをログ、DTO、OpenAPI、fixtureに入れないでください。
- 実データCSVを共有する場合は、Gitではなく別の安全な方法を使ってください。

## Compile and run the project

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
NODE_ENV=production pnpm run start:prod
```

## Run tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


## AIツールの勧め

- [Codex](https://openai.com/ja-JP/codex/)
- [headroom](https://github.com/chopratejas/headroom)
- [codegraph](https://github.com/colbymchenry/codegraph)
- [Hermes Agent](https://hermes-agent.org/ja/)
- [agentmemory](https://github.com/rohitg00/agentmemory)
