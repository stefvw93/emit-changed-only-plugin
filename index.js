var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("index", ["require", "exports", "fs", "path"], function (require, exports, fs_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    fs_1 = __importDefault(fs_1);
    path_1 = __importDefault(path_1);
    var EmitChangedOnlyPlugin = /** @class */ (function () {
        function EmitChangedOnlyPlugin(settings) {
            if (settings === void 0) { settings = {}; }
            this.settings = EmitChangedOnlyPlugin.defaultSettings;
            Object.assign(this.settings, settings);
        }
        EmitChangedOnlyPlugin.prototype.apply = function (compiler) {
            var _a = this.settings, production = _a.production, splitChunks = _a.splitChunks, alwaysOverwrite = _a.alwaysOverwrite;
            var optimization = compiler.options.optimization || {};
            var output = compiler.options.output || {};
            var mode = compiler.options.mode || "production";
            var handledAssets;
            if (!output || !output.path || !output.filename) {
                return;
            }
            var outDir = output.path || "";
            var distributedFiles = fs_1.default.existsSync(outDir)
                ? fs_1.default.readdirSync(outDir)
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
            compiler.hooks.emit.tap("EmitChangedOnlyPlugin", function (compilation) {
                var assets = Object.keys(compilation.assets);
                //  keep a back-up of compiled assets for 'done' hook
                handledAssets = assets;
                // remove assets if they whould always be overwritten, or if the file already exists
                distributedFiles
                    .filter(function (file) {
                    return alwaysOverwrite.indexOf(file) < 0 && assets.indexOf(file) > -1;
                })
                    .forEach(function (file) { return delete compilation.assets[file]; });
            });
            // https://webpack.js.org/api/compiler-hooks/#done
            compiler.hooks.done.tap("EmitChangedOnlyPlugin", function () {
                // clean unused files from previous build
                distributedFiles
                    .filter(function (file) {
                    return handledAssets.indexOf(file) < 0;
                })
                    .forEach(function (file) {
                    fs_1.default.unlinkSync(path_1.default.join(outDir, file));
                });
                if (output.filename.indexOf("[contenthash") < -1) {
                    console.log("EmitChangedOnlyPlugin: Using [contenthash] substitute in filename is recommended!");
                }
            });
        };
        EmitChangedOnlyPlugin.defaultSettings = {
            splitChunks: true,
            alwaysOverwrite: ["index.html"],
            production: true
        };
        return EmitChangedOnlyPlugin;
    }());
    exports.EmitChangedOnlyPlugin = EmitChangedOnlyPlugin;
    module.exports = EmitChangedOnlyPlugin;
});
