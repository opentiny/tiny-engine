# Contributing

We are glad that you are willing to contribute to the TinyEngine open source project. There are many forms of contribution. You can choose one or more of them based on your strengths and interests:

- Report [new defect](https://github.com/opentiny/tiny-engine/issues/new?template=bug-report.yml).
- Provide more detailed information for the [existing defects](https://github.com/opentiny/tiny-engine/labels/bug), such as supplementary screenshots, more detailed reproduction steps, minimum reproducible demo links, etc.
- Submit Pull requests to fix typos in the document or make the document clearer and better.
- Add the official assistant WeChat `opentiny-official` and join the technical exchange group to participate in the discussion.

When you personally use the TinyEngine component library and participate in many of the above contributions, as you become familiar with TinyEngine , you can try to do something more challenging, such as:

- Fix the defect. You can start with [Good-first issue](https://github.com/opentiny/tiny-engine/labels/good%20first%20issue).
- Implementation of new features
- Complete unit tests.
- Translate documents
- Participate in code review.

## Bug Reports

If you encounter problems in the process of using TinyEngine components, you are welcome to submit Issue to us. Before submitting Issue, please read the relevant [official documentation](https://opentiny.design/tiny-engine) carefully to confirm whether this is a defect or an unimplemented function.

If it is a defect, select [Bug report](https://github.com/opentiny/tiny-engine/issues/new?template=bug-report.yml) template when creating a new Issue. The title follows the format of `[toolkitName/pluginName/EngineCore] defect description`. For example: `[tiny-engine-toolbar-refresh] The refresh function cannot be used`.

Issue that reports defects mainly needs to fill in the following information:

- Version numbers of `tiny-engine` and `node`.
- The performance of the defect can be illustrated by screenshot, and if there is an error, the error message can be posted.
- Defect reproduction step, preferably with a minimum reproducible demo link.

If it is a new feature, select [Feature request](https://github.com/opentiny/tiny-engine/issues/new?template=feature-request.yml) template. The title follows the format of `[toolkitName/pluginName/EngineCore] new feature description`. For example: `[tiny-engine-theme] New Blue Theme`.

The following information is required for the Issue of the new feature:

- What problems does this feature mainly solve for users?
- What is the api of this feature?

## Pull Requests

Before submitting pull request, please make sure that your submission is in line with the overall plan of TinyEngine. Generally, issues that marked as [bug](https://github.com/opentiny/tiny-engine/labels/bug) are encouraged to submit pull requests. If you are not sure, you can create a [Discussion](https://github.com/opentiny/tiny-engine/discussions) for discussion.

Local startup steps:

- Click the Fork button in the upper right corner of the [TinyEngine](https://github.com/opentiny/tiny-engine) code repository to fork the upstream warehouse to the personal warehouse.
- Clone personal warehouse to local
- Run `npm install` under the TinyEngine root directory to install node dependencies.
- Run `npm install` under the TinyEngine mockServer to install node dependencies
- Run `npm run serve` under the TinyEngine root directory, and then `run npm run dev` in the mockServer directory to start local development.

```shell
# username indicates the user name. Replace it before running the command.
git clone git@github.com:username/tiny-engine.git
cd tiny-engine
git remote add upstream git@github.com:opentiny/tiny-engine.git
pnpm i

# Start the project.
$ pnpm dev

```

To submit a PR:

- Create a new branch `git checkout -b username/feature1`. The name of the branch should be `username/feat-xxx` / `username/fix-xxx`.
- Local coding.
- Submit according to [Commit Message Format](https://www.conventionalcommits.org/zh-hans/v1.0.0/) specification. PR that do not conform to the submission specification will not be merged.
- Submit to remote repository: `git push origin branchName`.
- (Optional) Synchronize upstream repository dev branch latest code: `git pull upstream develop`.
- Open the [Pull requests](https://github.com/opentiny/tiny-engine/pulls) link of the TinyEngine code repository and click the New pull request button to submit the PR.
- Project Committer conducts Code Review and makes comments.
- The PR author adjusts the code according to the opinion. Please note that when a branch initiates PR, the subsequent commit will be synchronized automatically, and there is no need to resubmit the PR.
- Project administrator merges PR.

The contribution process is over, thank you for your contribution!

## Join the open source community

If you are interested in our open source projects, please join our open source community in the following ways.

- Add the official assistant WeChat: opentiny-official, join our technical exchange group
- Join the mailing list: opentiny@googlegroups.com
