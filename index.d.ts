// Note that @types/browserify is not used for a reason:
// https://github.com/TypeStrong/tsify/issues/267

import * as typescript from "typescript";

interface Options {
	exclude?: string[];
	files?: string[];
	global?: boolean;
	include?: string[];
	m?: string;
	p?: string | Record<string, any>;
	project?: string | Record<string, any>;
	t?: string;
	typescript?: string | typeof typescript;
}

declare function tsify(b: any, opts: Options): any;
export = tsify;
