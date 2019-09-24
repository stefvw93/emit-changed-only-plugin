import fs from "fs";
import path from "path";
import webpack from "webpack";

type Settings = {
  alwaysOverwrite?: string | RegExp;
  exclude?: string | RegExp;
  production?: boolean;
  splitChunks?: boolean;
  test?: string | RegExp;
};

class EmitChangedOnlyPlugin {
  private static readonly defaultSettings: Settings = {
    splitChunks: true,
    production: true,
    test: /\.js/i
  };

  private readonly settings: Settings = EmitChangedOnlyPlugin.defaultSettings;

  constructor(settings: Settings = {}) {
    Object.assign(this.settings, settings);
  }

  private isMatch(
    filename: string,
    to?: string | RegExp,
    toRequired = false
  ): boolean {
    return (toRequired ? !!to : !to) || (!!to && !!filename.match(to));
  }

  apply(compiler: webpack.Compiler) {
    const {
      production,
      splitChunks,
      alwaysOverwrite,
      test,
      exclude
    } = this.settings;
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
      const assetsToIgnore = distributedFiles.filter(file => {
        const applyPluginToFile = this.isMatch(file, test);
        const excludeFile = this.isMatch(file, exclude, true);
        const alwaysOverwriteFile = this.isMatch(file, alwaysOverwrite);
        const identicalFileExists = assets.indexOf(file) > -1;

        console.log(exclude);
        if (!applyPluginToFile || excludeFile || alwaysOverwriteFile) {
          return false;
        }

        return identicalFileExists;
      });

      assetsToIgnore.forEach(file => delete compilation.assets[file]);
    });

    // https://webpack.js.org/api/compiler-hooks/#done
    compiler.hooks.done.tap("EmitChangedOnlyPlugin", () => {
      // clean unused files from previous build
      const filesToUnlink = distributedFiles.filter(file => {
        const applyPluginToFile = this.isMatch(file, test);
        const excludeFile = this.isMatch(file, exclude, true);
        const alwaysOverwriteFile = this.isMatch(file, alwaysOverwrite);
        const isAsset = handledAssets.indexOf(file) > -1;

        console.log("\n" + file, {
          applyPluginToFile,
          excludeFile,
          alwaysOverwriteFile,
          isAsset
        });

        if (!applyPluginToFile || excludeFile || !alwaysOverwriteFile) {
          return false;
        }

        return !isAsset;
      });

      console.log("files to unlink", filesToUnlink);
      filesToUnlink.forEach(file => {
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
