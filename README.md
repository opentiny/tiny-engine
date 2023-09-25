<p align="center">
  <a href="https://opentiny.design/tiny-engine" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny Logo" src="logo.svg" height="100" style="max-width:100%;">
  </a>
</p>

<p align="center">TinyEngine enables developers to customize low-code platforms, build low-bit platforms online in real time, and support secondary development or integration of low-bit platform capabilities.</p>

English | [简体中文](README.zh-CN.md)

🌈 Features:

- Cross-end cross-frame front-end components
- Supports online real-time construction, secondary development, or being integrated.
- Directly generate deployable source code without engine support.
- Allows access to third-party components and customized extension plug-ins.
- Supports high-code and low-code, and hybrid development and deployment of applications.
- The platform accesses AI big model capabilities to help developers build applications.

## Development

### Dependencies required for installation

```sh
$ npm install
$ pushd mockServer
$ npm install
$ popd
```

### Local development: Start the local mock server and use the mock data of the local mock server.

```sh
$ npm run serve

# start another terminal
$ cd mockServer
$ npm run dev
```

Open a browser: `http://localhost:8080/?type=app&id=918&tenant=1&pageid=NTJ4MjvqoVj8OVsc`
`url search` Parameters:

- `type=app` Application type
- `id=xxx` Application ID
- `tenant=xxx` Organization ID
- `pagdId=xxx` Page ID

## Build

```sh
# Build all plug-ins first
npm run build:plugin

# Build Designer
npm run build:alpha or build:prod

# Release all plug-ins.
npm run publish:plugin

# Publish the designer.
npm run publish:core

```

## Common Packet Sending Process

1. Release the plug-in.

```sh
npm run build:plugin && npm run publish:plugin
```

2. Publish Designer

a) Change the package name and version number.
Package name: @opentiny/tinybuilder-design-core-test
Version number: The last digit plus 1 each time. For example:

```
"name": "@opentiny/tinybuilder-design-core-test",
"version": "1.0.87",
```

b) npm publish

## 🤝 Participation and Contribution

If you are interested in our open source project, please join us! 🎉

Please read the [Contribution Guide](CONTRIBUTING.md) before participating in the contribution.

- Add official assistant WeChat opentiny-official and join the technical exchange group
- Join the mailing list opentiny@googlegroups.com

## Open source protocol

[MIT](LICENSE)
