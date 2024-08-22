# tiny-engine-canvas

## build

Note: tiny-engine-canvas module contains two parts， *canvas-container* and *canvas*, and canvas is rendered in iframe window
In build phase, they are separately build. The build product of them use different external strategy, and the product of *canvas*  will embed with base64 format in the product of *canvas-container*,
since the library-mode-build now only supports embed dependent assets in base64 format, and the embedded base64 format is more general for other build and pack tools.
You should notice the difference between the product of *canvas-container* and *canvas*. The product of  *canvas-container* work fine with other *tiny-engine-\** packages with unfixed versions. And the product of *canvas* only external `vue` and `vue-i18n`, the rest of dependent packages will be packed and won't be replaceable to other version. (That means you will not be able to joint-debug the dependent packages inside *canvas* product code. You should join-debug using canvas module source code.)

Develop and debug canvas module in development mode needs:

1) set vite config with devAlias(`resolve.alias`) which makes canvas package name pointed to canvas module source code
2) use canvas-dev-external plugin

Vite use esbuild in development, devAlias configuration makes the source code of canvas module work and able to joint debug.
But esbuild won't perceive the external configuration for rollup, it will resolve `vue` and other dependencies (that we originally wanted to exclude and let they naturally point to the package addresses in the `importmap`) to `node_modules`.
For this reason, we need the `canvas-dev-external` plugin. It can externalize the dependencies specified in the `importmap` of *canvas* for esbuild.
On the other hand, externalizing the dependencies will affect all other package in the same runtime, this plugin will generate another `impoartmap` that point all effected dependencies to `node_modules` to eliminate the side effects.

Finally, modules inside and outside the *canvas* iframe can joint debug well, and we accomplish the goal of decoupling the versions of `vue` and other dependencies inside and outside the *canvas*. (That is, we can use complete different version of `vue` inside or outside the *canvas*， we don‘t need to synchronize the version.
In some cases, we may want to use the lower or higher version for better support.)

## 构建

注意： tiny-engine-canvas模块目前含有两部分，*画布容器*和*画布*， 其中*画布*在iframe内进行渲染。
在构建阶段canvas包使用分开构建，在构建完的产物中，*画布容器*和*画布*使用了不同的external策略，打包完后*画布*源码会base64内嵌到*画布容器*源码中。
目前库打包依赖资源仅支持base64，且base64内嵌普适性较高，在其他非vite打包工具下能正常工作。
所以使用canvas包产物应该注意到，*画布容器*打包后仍然可以和其他*tiny-engine-\**的包的不同版本配合工作，而*画布*本身打包完后内容就固化了，不会再和其他包联动。

开发态开发和调试canvas包需要:
1） vite配置中 devAlias（`resolve.alias`）将canvas包名指向canvas的src源码
2） 搭配canvas-dev-external插件使用
当前开发态vite使用了esbuild， devAlias配置将能正常工作和联调， 但是esbuild不接收来自rollup配置的externals，将导致原本画布应该走`importmap`解析的内容指向了`node_modules`,
故需要搭配canvas-dev-external插件，一方面将*画布*的external项排除，另一方面，对*画布*外也造成的影响将通过另一个指向`node_modules`的`importmap`进行补偿

最后，通过以上方式，画布内外能够很好地联调，并且完成了画布内外vue版本的解耦（即可以支持使用完全不同的vue版本）
