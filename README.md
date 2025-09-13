# Gmail SBIデビットパーサー

住信SBIネット銀行のデビットカード利用通知メールを、Gmail
APIを利用して取得し、CSVファイルとして出力するTypeScript製のアプリケーションです。

## 主な特徴

- OAuth2.0を使用した安全なGmail認証
- 取引データの自動抽出と分析機能
- CSV形式による詳細なレポート出力
- 月別の集計レポート生成機能
- 加盟店ごとの利用統計情報の出力
- TypeScriptによる型安全な実装
- Jestを用いたテストカバレッジ

## セットアップ手順

### 1. 依存関係のインストール

下記のコマンドを実行し、必要なパッケージをインストールします。

```bash
npm install
```

### 2. Gmail APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスします。
2. 新規プロジェクトを作成します。
3. Gmail APIを有効化します。
4. OAuth2.0の認証情報を作成します。
   - アプリケーションの種類：「ウェブアプリケーション」
   - リダイレクトURI：`http://localhost:3000/oauth2callback`
5. 発行されたクライアントIDとクライアントシークレットを取得します。

### 3. 環境変数の設定

`.env.example`ファイルをコピーして`.env`という名前のファイルを作成し、内容を編集します。

```bash
cp .env.example .env
```

次に、`.env`ファイルにご自身の環境に合わせて値を設定してください。

```env
# Gmail API設定
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# オプション設定
MAX_RESULTS=500  # 取得するメールの最大件数
OUTPUT_DIR=./output  # レポートの出力先ディレクトリ
```

## ご利用方法

### ビルドと実行

```bash
# TypeScriptのビルド
npm run build

# アプリケーションの実行
npm start
```

### 開発モード

開発時には、以下のコマンドでTypeScriptを直接実行できます。

```bash
npm run dev
```

### テストの実行

```bash
# テストの実行
npm test

# カバレッジレポート付きのテスト
npm run test:coverage

# ウォッチモードでのテスト
npm run test:watch
```

### 実行例

アプリケーションを実行すると、以下のような出力が表示されます：

```console
❯ npm start

> gmail-sbi-debit-parser@2.0.0 start
> npm run build && node dist/index.js

住信SBIネット銀行 デビットカード利用履歴取得システム
================================================

Gmail APIに接続中...
住信SBIネット銀行のデビットカード利用通知を検索中...
120 件のメールを取得中...

120 件の取引を抽出しました

# 住信SBIネット銀行 デビットカード利用レポート

## 利用サマリー

| 項目 | 値 |
|------|-----|
| 総利用回数 | 120 回 |
| 総利用金額 | ¥2,145,892 |
| 平均利用額 | ¥17,882 |

## 利用回数TOP5加盟店

| 順位 | 加盟店 | 利用回数 | 合計金額 |
|------|--------|----------|----------|
| 1 | ABC Store | 28回 | ¥185,432 |
| 2 | XYZ Market | 15回 | ¥45,678 |
| 3 | Sample Pharmacy | 12回 | ¥23,456 |
| 4 | Demo Shop | 8回 | ¥12,345 |
| 5 | Test Restaurant | 7回 | ¥98,765 |

## 最近の利用 (直近5件)

| 日付 | 加盟店 | 金額 |
|------|--------|------|
| 2025-09-15 | Sample Market | ¥4,567 |
| 2025-09-14 | Demo Store | ¥2,345 |
| 2025-09-13 | Test Shop | ¥789 |
| 2025-09-12 | ABC Convenience | ¥1,234 |
| 2025-09-10 | XYZ Restaurant | ¥5,678 |

詳細CSVファイルを保存しました: output/sbi_debit_20250915_142030.csv
月別サマリーを保存しました: output/sbi_debit_monthly_20250915_142030.csv
```

## 出力ファイルについて

処理が完了すると、`output/`ディレクトリに以下の2種類のCSVファイルが生成されます。

1. **sbi_debit_YYYYMMDD_HHmmss.csv**
   - 全ての取引に関する詳細情報を含みます。
   - 主な列：利用日、利用時刻、利用加盟店、金額、通貨、承認番号、メール受信日時

2. **sbi_debit_monthly_YYYYMMDD_HHmmss.csv**
   - 月ごとの利用状況を集計したサマリーです。
   - 主な列：年月、利用回数、合計金額、平均金額

## プロジェクト構成

```text
gmail-sbi-debit-parser/
├── src/
│   ├── auth/           # GmailのOAuth認証関連
│   ├── parsers/        # メールの解析処理
│   ├── services/       # レポート生成サービス
│   ├── types/          # TypeScriptの型定義
│   └── index.ts        # アプリケーションのエントリーポイント
├── tests/              # 各種テストコード
├── config/             # 認証トークンの保存先
├── output/             # CSVファイルの出力先
└── data/               # テスト用のデータなど
```

## セキュリティについて

- `.gitignore`ファイルにより、機密情報を含むファイルがGitの管理対象から除外されるように設定されています。
- OAuth2.0の認証トークンは、`config/`ディレクトリ内に安全に保存されます。
- 認証情報は環境変数を通じて管理されます。

## ライセンス

本プロジェクトはMITライセンスです。
