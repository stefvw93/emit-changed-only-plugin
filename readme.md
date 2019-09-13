# emit-changed-only-plugin

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

const EmitChangedOnlyPlugin = require("emit-changed-only-plugin");

module.exports = {
  mode: "production",
  context: "./src",
  entry: "index.js",
  output: {
    path: "./dist",
    /**
     * !!! You should add the content hash substitute to your filename !!!
     */
    filename: "[name].[contenthash].js"
  },

  /**
   * Plugin is over here! vvv
   */
  plugins: [new EmitChangedOnlyPlugin()]
};
```

### Settings

You can pass some settings, but this should generally not be necessary.
|Name|Type|Description
|-|-|-|
|alwaysOverwrite|Array\<string\>|File(names) to always overwrite|
|production|Boolean|Set to false to use outside of production mode|
|splitChunks|Boolean|Set to false to not split into chunks (not recommended)|

Settings example:

```javascript
new EmitChangedOnlyPlugin({
  splitChunks: false,
  alwaysOverwrite: ["index.html", "style.css"]
});
```
