import { BrowserifyObject, CustomOptions } from "browserify";
import { CompilerOptions, ModuleKind, ScriptTarget } from "typescript";

export interface Options extends CustomOptions, CompilerOptions {
	typescript?: string | import("typescript");
	global?: boolean;
	m?: ts.ModuleKind;
	p?: string | ts.CompilerOptions;
	project?: string | ts.CompilerOptions;
	t?: ts.ScriptTarget;
}

function tsify(b: BrowserifyObject, opts: Options): any;

export = tsify;
