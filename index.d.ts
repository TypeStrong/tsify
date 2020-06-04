import { BrowserifyObject, CustomOptions } from "browserify";
import { CompilerOptions, ModuleKind, ScriptTarget } from "typescript";

export interface Options extends CustomOptions, CompilerOptions {
	typescript?: string | import("typescript");
	global?: boolean;
	m?: ModuleKind;
	p?: string | CompilerOptions;
	project?: string | CompilerOptions;
	t?: ScriptTarget;
}

function tsify(b: BrowserifyObject, opts: Options): any;

export = tsify;
