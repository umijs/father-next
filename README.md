# father

[![version](https://badgen.net/npm/v/father)](https://www.npmjs.com/package/father) [![codecov](https://codecov.io/gh/umijs/father/branch/master/graph/badge.svg)](https://codecov.io/gh/umijs/father) [![GitHub Actions status](https://github.com/umijs/father/workflows/CI/badge.svg)](https://github.com/umijs/father)

father 是一款 NPM 包研发工具，能够帮助开发者更高效、高质量地研发 NPM 包、生成构建产物、再完成发布。它主要具备以下特性：

- ⚔️ **双模式构建：** 支持 Bundless 及 Bundle 两种构建模式，ESModule 及 CommonJS 产物使用 Bundless 模式，UMD 产物使用 Bundle 模式
- 🎛 **多构建核心：** Bundle 模式使用 Webpack 作为构建核心，Bundless 模式使用 esbuild 及 Babel 两种构建核心，可通过配置自由切换
- 🔖 **类型生成：** 无论是源码构建还是依赖预打包，都支持为 TypeScript 模块生成 `.d.ts` 类型定义
- 🩺 **项目体检：** 对 NPM 包研发常见误区做检查，让每一次发布都更加稳健
- 🏗 **微生成器：** 为项目追加生成常见的工程化能力，例如使用 jest 编写测试
- 📦 **依赖预打包：** 开箱即用的依赖预打包能力，帮助 Node.js 框架/库提升稳定性、不受上游依赖更新影响（实验性）

访问 [指南](./docs/guide/index.md) 及 [配置项](./docs/config.md) 了解更多。

## 贡献指南

查看 [CONTRIBUTING](./CONTRIBUTING.md) 文档。

## License

[MIT](./LICENSE)
