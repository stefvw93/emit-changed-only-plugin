import fs from "fs";
import path from "path";
import webpack from "webpack";

export type Settings = {
  alwaysOverwrite?: string[];
  production?: boolean;
  splitChunks?: boolean;
};

export class EmitChangedOnlyPlugin {
  private static readonly defaultSettings: Settings = {
    splitChunks: true,
    alwaysOverwrite: ["index.html"],
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
      const assets = Object.keys(compilation.assets);

      //  keep a back-up of compiled assets for 'done' hook
      handledAssets = assets;

      // remove assets if they whould always be overwritten, or if the file already exists
      distributedFiles
        .filter(
          file =>
            alwaysOverwrite!.indexOf(file) < 0 && assets.indexOf(file) > -1
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

      if (output.filename!.indexOf("[contenthash") < -1) {
        console.log(
          "EmitChangedOnlyPlugin: Using [contenthash] substitute in filename is recommended!"
        );
      }
    });
  }
}

module.exports = EmitChangedOnlyPlugin;
