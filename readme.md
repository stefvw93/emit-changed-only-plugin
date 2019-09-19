# emit-changed-only-webpack-plugin

Webpack production plugin to only emit changed files.

Why?

When your app bundle is overwritten - even when maintaining the same file name - the server might see the file is changed (e.g. by modified date). A client browser will request the file and the server will tell the browser that the file changed. Which results in the browser redownloading the file and thus your javascript will have to recompile or serialize your js, every time the app is started.

See https://v8.dev/blog/code-caching-for-devs.

Using this plugin, identical files won't be modified: No new date, no new ETag, so your app will be browser cache friendly. This will grant your web app faster load times and less data usage.

🔥

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
      exclude: /\.html/i
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
|test|string \| RegExp|Apply the plugin to matched filenames|/\\.js/i
|exclude|string \| RegExp|The plugin won't do anything to the matched filenames|undefined

## Note

The plugin will attempt to keep your distribution directory clean, by removing outdated, previously built files. So you won't have to - and should not - clear your distribution directory. To keep certain files from being deleted, you can add them to the `exclude` setting.
