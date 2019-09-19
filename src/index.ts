import fs from "fs";
import path from "path";
import webpack from "webpack";

type Settings = {
  alwaysOverwrite?: string | RegExp;
  production?: boolean;
  splitChunks?: boolean;
};

class EmitChangedOnlyPlugin {
  private static readonly defaultSettings: Settings = {
    splitChunks: true,
    alwaysOverwrite: /\.html/i,
    production: true
  };

  private readonly settings: Settings = EmitChangedOnlyPlugin.defaultSettings;

  constructor(settings: Settings = {}) {
    Object.assign(this.settings, settings);
  }

  apply(compiler: webpack.Compiler) {
    const { production, splitChunks, alwaysOverwrite } = this.settings;
    const optimization = compiler.options.optimization || {};
    const output = compiler.options.output || {};
    const mode = compiler.options.mode || "production";
    let handledAssets: string[];

    if (!output || !output.path || !output.filename) {
      return;
    }

    const outDir = output.path || "";
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
      optimization.splitChunks = optimization.splitChunks || {};
      optimization.splitChunks.chunks = "all";
    }

    // https://webpack.js.org/api/compiler-hooks/#emit
    compiler.hooks.emit.tap("EmitChangedOnlyPlugin", compilation => {
      // get assets
      const assets = Object.keys(compilation.assets);

      //  keep a back-up of compiled assets for 'done' hook
      handledAssets = assets;

      // remove assets if they should always be overwritten, or if the file already exists
      distributedFiles
        .filter(file => {
          const shouldBeOverwritten = !!file.match(alwaysOverwrite!);
          const identicalFileExists = assets.indexOf(file) > -1;
          return shouldBeOverwritten || identicalFileExists;
        })
        .forEach(file => delete compilation.assets[file]);
    });

    // https://webpack.js.org/api/compiler-hooks/#done
    compiler.hooks.done.tap("EmitChangedOnlyPlugin", () => {
      // clean unused files from previous build
      distributedFiles
        .filter(file => {
          const shouldKeep = !!file.match(alwaysOverwrite!);
          const isAsset = handledAssets.indexOf(file) > -1;
          if (shouldKeep) return false;
          return !isAsset;
        })
        .forEach(file => {
          try {
            fs.unlinkSync(path.join(outDir, file));
          } catch (error) {
            console.log(
              `EmitChangedOnlyPlugin could not unlink ${outDir}/${file}`
            );
          }
        });

      if (output.filename!.indexOf("[contenthash") < -1) {
        console.log(
          "EmitChangedOnlyPlugin: Using [contenthash] substitute in filename is recommended!"
        );
      }
    });
  }
}

module.exports = EmitChangedOnlyPlugin;
