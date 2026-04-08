# Webpack Loader & Plugin 是什么，用过吗

## 面试题 1：Loader 和 Plugin 的本质区别是什么？

- Loader 是文件转换器, Plugin 是功能扩展器
- Loader 在模块加载时工作,Plugin 在整个构建生命周期工作
- Loader 是单一职责（处理特定文件）,Plugin 可以做任何事


一般常见的Loader 比如像
```plaintxt
// 样式处理
style-loader    // 把 CSS 插入到 DOM
css-loader      // 解析 @import 和 url()
sass-loader     // 编译 Sass/SCSS
postcss-loader  // CSS 后处理（自动加前缀等）

// 脚本处理
babel-loader    // ES6+ 转 ES5
ts-loader       // TypeScript 编译

// 资源处理
file-loader     // 文件输出到目录
url-loader      // 小文件转 base64
image-webpack-loader // 图片压缩

// 其他
vue-loader      // 解析 .vue 单文件组件

```

常见的 Plugin 有哪些？分别解决什么问题？
```plaintxt
// HTML 处理
HtmlWebpackPlugin          // 自动生成 HTML 并注入资源

// 代码优化
TerserPlugin              // JS 压缩混淆
MiniCssExtractPlugin      // CSS 提取成独立文件
OptimizeCSSAssetsPlugin   // CSS 压缩

// 开发体验
HotModuleReplacementPlugin // 热更新
FriendlyErrorsPlugin      // 友好的错误提示

// 分析工具
BundleAnalyzerPlugin      // 打包体积分析
SpeedMeasurePlugin        // 构建速度分析

// 其他
CleanWebpackPlugin        // 清理输出目录
CopyWebpackPlugin         // 复制静态资源
DefinePlugin              // 定义全局常量
```


## Loader 的执行顺序是什么？ 如何自定义一个Loader

那么Loader 的本质是函数，执行顺序是从右往左，从下往上，每个 Loader 接收上一个 Loader 的输出作为输入

```javascript
module.export = function(){
  // source 是文件内容（字符串或 Buffer）
  // 返回处理后的内容
  return transformedSource;
}
// markdown-loader.js
const marked = require('marked');

module.exports = function(source) {
  // 1. 获取 Loader 配置项
  const options = this.getOptions();
  
  // 2. 转换 Markdown 为 HTML
  const html = marked(source);
  
  // 3. 返回 JS 模块代码
  return `export default ${JSON.stringify(html)}`;
}

// webpack.config.js
module: {
  rules: [
    {
      test: /\.md$/,
      use: [
        'html-loader',
        './loaders/markdown-loader'
      ]
    }
  ]
}
```

## Plugin 的工作原理是什么？如何自定义一个 Plugin？
```javascript
// Plugin 是一个带 apply 方法的类
class MyPlugin {
  apply(compiler) {
    // compiler 是 Webpack 实例
    // 通过 hooks 监听构建生命周期
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // compilation 包含本次构建的所有信息
      console.log('即将输出文件...');
      callback();
    });
  }
}

module.exports = MyPlugin;

```

核心 Hooks 生命周期：
```plaintxt
// 初始化阶段
compiler.hooks.initialize
compiler.hooks.environment
compiler.hooks.afterEnvironment

// 编译阶段
compiler.hooks.compile
compiler.hooks.compilation
compiler.hooks.make

// 输出阶段
compiler.hooks.emit        // 输出前（可修改资源）
compiler.hooks.afterEmit   // 输出后
compiler.hooks.done        // 完成
```