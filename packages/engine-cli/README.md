# engine-cli

tiny-engine cli for create new designer/plugin/...

## dev

```sh
npm run dev    # build in watch mode
npm run build  # build engine-cli
npm link       # after link, you can test engine-cli commands use: engine-cli create xxx
```

## usage

### create platform or plugin by prompt

```sh
# dynamic create platform or plugin by complete prompt
npx @opentiny/tiny-engine-cli@latest create
```

### create a tiny-engine platform

```sh
npx @opentiny/tiny-engine-cli@latest create-platform my-designer
```

### create a tiny-engine plugin

```sh
npx @opentiny/tiny-engine-cli@latest create-plugin my-plugin
```
