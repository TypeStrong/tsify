import { BrowserifyObject, CustomOptions } from "browserify";
import typescript, { CompilerOptions, ModuleKind, ScriptTarget } from "typescript";

// Provide local definition of Omit for compatibility with TypeScript <3.5
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface Options extends CustomOptions, Omit<CompilerOptions, "project"> {
	typescript?: string | typeof typescript;
	global?: boolean;
	m?: ModuleKind;
	p?: string | CompilerOptions;
	project?: string | CompilerOptions;
	t?: ScriptTarget;
}

export default function tsify(b: BrowserifyObject, opts: Options): any;
