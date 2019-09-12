const fs = require("fs");
const path = require("path");

class EmitChangedOnlyPlugin {
  constructor(settings = {}) {
    this.settings = {
      splitChunks: true,
      alwaysOverwrite: ["index.html"]
    };

    Object.assign(this.settings, settings);
  }

  apply(compiler) {
    const { optimization, output, mode } = compiler.options;
    const { production, splitChunks, alwaysOverwrite } = this.settings;
    const outDir = output.path;
    const distributedFiles = fs.existsSync(outDir)
      ? fs.readdirSync(outDir)
      : [];

    if (production === true && mode !== "production") {
      return;
    }

    // split build into chunks
    // https://webpack.js.org/configuration/optimization/#optimizationsplitchunks
    if (splitChunks === true) {
      optimization.runtimeChunk = "single";
      optimization.splitChunks.chunks = "all";
    }

    let handledAssets;

    // https://webpack.js.org/api/compiler-hooks/#emit
    compiler.hooks.emit.tap("EmitChangedOnlyPlugin", compilation => {
      const assets = Object.keys(compilation.assets);

      //  keep a back-up of compiled assets for 'done' hook
      handledAssets = assets;

      // remove assets if they whould always be overwritten, or if the file already exists
      distributedFiles
        .filter(
          file => alwaysOverwrite.indexOf(file) < 0 && assets.indexOf(file) > -1
        )
        .forEach(file => delete compilation.assets[file]);
    });

    // https://webpack.js.org/api/compiler-hooks/#done
    compiler.hooks.done.tap("EmitChangedOnlyPlugin", () => {
      // clean unused files from previous build
      distributedFiles
        .filter(file => {
          return handledAssets.indexOf(file) < 0;
        })
        .forEach(file => {
          fs.unlinkSync(path.join(outDir, file));
        });

      if (output.filename.indexOf("[contenthash") < -1) {
        console.log(
          "EmitChangedOnlyPlugin: Using [contenthash] substitute in filename is recommended!"
        );
      }
    });
  }
}

module.exports = EmitChangedOnlyPlugin;
