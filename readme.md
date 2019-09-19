# emit-changed-only-webpack-plugin

Webpack production plugin to only emit changed files.

## Usage

### Install the plugin

```bash
npm i -D emit-changed-only-plugin
```

### Use the plugin

Important! Use the webpack substitute `[contenthash]` in your filename. This is used to compare file versions.

```javascript
// webpack.production.js

const EmitChangedOnlyPlugin = require("emit-changed-only-webpack-plugin");

module.exports = {
  // ... webpack config

  output: {
    path: "./dist",
    /**
     * Use a hashed webpack substitute to generate a filename.
     * [contenthash] is recommended because the hash represents file contents.
     */
    filename: "[name].[contenthash].js"
  },
  plugins: [
    new EmitChangedOnlyPlugin({
      alwaysOverwrite: /\.html/i
    })
  ]
};
```

### Settings

You can pass some settings, but this should generally not be necessary.
|Name|Type|Description|Default
|-|-|-|-|
|alwaysOverwrite|string \| RegExp|Matches will alway be emitted|undefined
|production|boolean|Require webpack production mode|true
|splitChunks|boolean|Use chunk splitting (recommended)|true
