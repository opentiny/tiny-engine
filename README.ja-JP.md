<p align="center">
  <a href="https://opentiny.design/tiny-engine" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny Logo" src="logo.svg" height="100" style="max-width:100%;">
  </a>
</p>

<p align="center">TinyEngine により、開発者はローコードプラットフォームをカスタマイズし、低ビットプラットフォームをオンラインでリアルタイムに構築し、ロービットプラットフォーム機能の二次開発や統合をサポートすることができます。</p>

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

🌈 特徴:

- クロスエンド クロスフレーム フロントエンドコンポーネント
- オンラインリアルタイムコンストラクション、二次開発、または統合をサポート。
- エンジンのサポートなしでデプロイ可能なソースコードを直接生成。
- サードパーティのコンポーネントやカスタマイズされた拡張プラグインへのアクセスを許可します。
- アプリケーションのハイコード、ローコード、ハイブリッド開発とデプロイをサポートします。
- このプラットフォームは、開発者がアプリケーションを構築するのを支援するために、AI のビッグモデル機能にアクセスする。

## 開発

### インストールに必要な依存関係

```sh
$ pnpm install
```

### ローカル開発: ローカルモックサーバーを起動し、ローカルモックサーバーのモックデータを使用する。

```sh
$ pnpm dev
```

ブラウザで開く: `http://localhost:8080/?type=app&id=918&tenant=1&pageid=NTJ4MjvqoVj8OVsc`
`url search` パラメータ:

- `type=app` アプリケーションタイプ
- `id=xxx` アプリケーション ID
- `tenant=xxx` 組織 ID
- `pageid=xxx` ページ ID

## ビルド

```sh
# 先ずすべてのプラグインをビルドする
pnpm build:plugin

# デザイナーをビルド
pnpm build:alpha or build:prod

```

## 🤝 参加とコントリビュート

私たちのオープンソースプロジェクトに興味がある方は、ぜひご参加ください！ 🎉

コントリビューションに参加する前に、[コントリビューションガイド](CONTRIBUTING.ja-JP.md)をお読みください。

- 公式アシスタント WeChat opentiny-official を追加し、技術交流グループに参加する
- メーリングリストに参加 opentiny@googlegroups.com

## ライセンス

[MIT](LICENSE)
