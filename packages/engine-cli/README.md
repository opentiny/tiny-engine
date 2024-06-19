# engine-cli

tiny-engine cli for create new designer/plugin/...

## dev

```sh
npm run dev    # build in watch mode
npm run build  # build engine-cli
npm link       # after link, you can test engine-cli commands use: engine-cli create xxx
```

## usage

### create

```sh
npx @opentiny/tiny-engine-cli@latest create my-designer
```

### dev

```sh
cd my-designer && npm install # install
npm run dev                   # designer dev
npm run build                 # designer build
```

