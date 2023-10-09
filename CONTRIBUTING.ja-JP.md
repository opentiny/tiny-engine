# コントリビュート

TinyEngine オープンソースプロジェクトにコントリビュートしていただけることを嬉しく思います。コントリビュートにはさまざまな形があります。あなたの長所や興味に基づいて、1 つまたは複数を選択することができます:

- [新しい欠陥](https://github.com/opentiny/tiny-engine/issues/new?template=bug-report.yml)を報告する。
- [既存の不具合](https://github.com/opentiny/tiny-engine/labels/bug)について、補足的なスクリーンショット、より詳細な再現手順、再現可能な最小限のデモリンクなど、より詳細な情報を提供してください。
- 文書の誤字脱字を修正したり、文書をより分かりやすく、より良いものにするために、Pull Request を提出してください。
- 公式アシスタントの WeChat `opentiny-official` を追加し、技術交流グループに参加して議論に参加する。

個人的に TinyEngine コンポーネントライブラリを使い、上記のような多くの貢献活動に参加し、TinyEngine に慣れてきたら、次のような、よりチャレンジングなことにも挑戦してみましょう:

- 不具合を直す。まずは [Good-first issue](https://github.com/opentiny/tiny-engine/labels/good%20first%20issue) から始めてください。
- 新機能の実装
- 単体テストの完了。
- ドキュメントの翻訳
- コードレビューに参加する。

## バグレポート

TinyEngine コンポーネントを使用していて不具合が発生した場合は、Issue をお寄せください。Issue を提出する前に、該当する[公式ドキュメント](https://opentiny.design/tiny-engine)をよく読み、不具合なのか未実装の機能なのかを確認してください。

不具合であれば、新しい Issue を作成する際に [Bug report](https://github.com/opentiny/tiny-engine/issues/new?template=bug-report.yml) テンプレートを選択してください。タイトルは `[toolkitName/pluginName/EngineCore] defect description` のフォーマットに従ってください。例: `[tiny-engine-toolbar-refresh] The refresh function cannot be used`。

不具合を報告する課題は、主に以下の情報を記入する必要があります:

- `tiny-engine` と `node` のバージョン番号。
- 不具合のパフォーマンスをスクリーンショットで示し、エラーがあればエラーメッセージを掲載する。
- 不具合の再現ステップ、できれば最低限再現可能なデモリンク。

新機能の場合は、[Feature request](https://github.com/opentiny/tiny-engine/issues/new?template=feature-request.yml) テンプレートを選択してください。タイトルは `[toolkitName/pluginName/EngineCore] new feature description` の書式に従います。例: `[tiny-engine-theme] New Blue Theme`。

新機能の課題には、以下の情報が必要です:

- この機能は主にユーザーのどのような問題を解決するのか？
- この機能の api は何ですか？

## Pull Requests

プルリクエストを提出する前に、提出する内容が TinyEngine 全体の計画に沿っていることを確認してください。一般に、[bug](https://github.com/opentiny/tiny-engine/labels/bug) とマークされている課題は、プルリクエストを提出することが推奨されています。よくわからない場合は、[Discussion](https://github.com/opentiny/tiny-engine/discussions) を作成して議論してください。

ローカル起動ステップ:

- [TinyEngine](https://github.com/opentiny/tiny-engine) コードリポジトリの右上にある [Fork] ボタンをクリックすると、上流のリポジトリが個人リポジトリにフォークされます。
- パーソナルウェアハウスをローカルにクローンする
- TinyEngine のルートディレクトリで `npm install` を実行し、ノードの依存関係をインストールします。
- TinyEngine mockServer 配下で `npm install` を実行してノードの依存関係をインストールする
- TinyEngineのルートディレクトリで `npm run serve` を実行し、mockServer ディレクトリで `run npm run dev` を実行してローカル開発を開始する。

```shell
# username はユーザー名を示す。コマンドを実行する前に置き換えてください。
git clone git@github.com:username/tiny-engine.git
cd tiny-engine
git remote add upstream git@github.com:opentiny/tiny-engine.git
npm i

# プロジェクトを開始する。
$ npm run serve

# 別のターミナルを開始
$ cd mockServer
$ npm run dev
```

PRを提出するには:

- 新しいブランチ `git checkout -b username/feature1` を作成します。ブランチ名は `username/feat-xxx` / `username/fix-xxx` とする。
- ローカルコーディング。
- [コミットメッセージフォーマット](https://www.conventionalcommits.org/zh-hans/v1.0.0/) の仕様に従って投稿してください。投稿仕様に従わない PR はマージされません。
- リモートリポジトリに投稿する: `git push origin branchName`。
- (オプション) アップストリームリポジトリの dev ブランチの最新コードを同期します: `git pull upstream dev`。
- TinyEngine コードリポジトリの [Pull requests](https://github.com/opentiny/tiny-engine/pulls) リンクを開き、New pull request ボタンをクリックして PR を投稿します。
- プロジェクトコミッターがコードレビューを行い、意見を述べる。
- PR 作成者はその意見に従ってコードを調整します。ブランチが PR を始めると、その後のコミットも自動的に同期されるので、PR を再提出する必要はありません。
- プロジェクト管理者が PR をマージする。

コントリビュートのプロセスは終わりです、コントリビュートありがとうございました！

## オープンソースコミュニティに参加する

私たちのオープンソースプロジェクトに興味がある方は、以下の方法でオープンソースコミュニティに参加してください。

- 公式アシスタントを WeChat に追加: opentiny-official、技術交流グループに参加する
- メーリングリストに参加する: opentiny@googlegroups.com
