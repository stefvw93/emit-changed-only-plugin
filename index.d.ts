/// <reference types="webpack" />
declare module "index" {
    import webpack from "webpack";
    export type Settings = {
        alwaysOverwrite?: string[];
        production?: boolean;
        splitChunks?: boolean;
    };
    export class EmitChangedOnlyPlugin {
        private static readonly defaultSettings;
        private readonly settings;
        constructor(settings?: Settings);
        apply(compiler: webpack.Compiler): void;
    }
}
