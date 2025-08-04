# 楽天GOLD商品ページ自動生成システム

## 🚀 超簡単！3ステップで開始

### ステップ1: システム起動
```
START.bat をダブルクリック
```

### ステップ2: 初期セットアップ
メニューで「1. 初期セットアップ実行」を選択

### ステップ3: APIキー設定
メニューで「2. 設定管理」を選択してAPIキーを設定

## 📋 作成されたBATファイル一覧

| ファイル名 | 用途 | 説明 |
|------------|------|------|
| **START.bat** | メインメニュー | **最初にこれを実行！** |
| setup.bat | 初期セットアップ | Python環境・ライブラリ設定 |
| rakuten_gold_start.bat | GUI版起動 | 使いやすいGUI画面 |
| rakuten_cli.bat | CLI版起動 | コマンドライン操作 |
| config.bat | 設定管理 | APIキー設定・メンテナンス |

## 🎯 使用方法

### 🖥️ GUI版（推奨）
1. `START.bat` → `3. GUI版起動`
2. APIキーを入力して保存
3. ASINを入力して「自動生成開始」

### 💻 CLI版（上級者向け）
1. `START.bat` → `4. CLI版起動`
2. メニューから処理方法を選択
3. ASINを入力して実行

## ⚙️ API設定

### 必要なAPIキー

1. **Amazon Product Data API**
   - RapidAPI (https://rapidapi.com/) で「Amazon Product API」検索
   - 月額$50-200程度

2. **Google Gemini AI API**
   - https://makersuite.google.com/ で無料取得

3. **楽天RMS API**
   - 楽天RMS → 店舗設定 → API
   - Service Secret と License Key

### 設定方法
1. `START.bat` → `2. 設定管理` → `1. .env ファイル編集`
2. APIキーを実際の値に置き換え
3. ファイルを保存

## 📁 ファイル構成

```
rakuten-gold/
├── START.bat                    ★ メインメニュー（最初に実行）
├── setup.bat                    ★ 初期セットアップ
├── rakuten_gold_start.bat       ★ GUI版起動
├── rakuten_cli.bat              ★ CLI版起動
├── config.bat                   ★ 設定管理
├── main.py                      # メインプログラム
├── rakuten_gold_automation.py   # 自動化システム
├── requirements.txt             # 必要ライブラリ
├── .env.example                 # 設定例
├── templates/
│   └── rakuten_gold_template.html
├── input/
│   └── sample_asin_list.csv
└── output/
    ├── rakuten_pages/           # 生成されたHTMLファイル
    └── results/                 # 処理結果CSV
```

## 🎉 期待効果

- **作業時間短縮**: 2時間 → 20分 (83%削減)
- **品質向上**: AI生成によるSEO最適化
- **売上向上**: 楽天市場での検索順位向上
- **効率化**: 一括処理による大量商品対応

## 🆘 トラブルシューティング

### よくある問題

**Pythonエラー:**
```
'python' は、内部コマンドまたは外部コマンド...
```
→ Python 3.8以上をインストールしてください

**APIエラー:**
```
❌ 以下の環境変数が設定されていません
```
→ `config.bat` でAPIキーを設定してください

**権限エラー:**
```
アクセスが拒否されました
```
→ 管理者権限でBATファイルを実行してください

### サポート情報

- ログファイル: `rakuten_automation.log`
- 設定ファイル: `.env`
- データベース: `rakuten_automation.db`

## 🚀 今すぐ開始！

```
1. START.bat をダブルクリック
2. 「1. 初期セットアップ実行」を選択
3. 「2. 設定管理」でAPIキー設定
4. 「3. GUI版起動」でシステム開始！
```

システムが正常に動作することを確認して、楽天での売上アップを実現しましょう！
