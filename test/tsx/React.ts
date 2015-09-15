// simplified test implementation of React.createElement
export function createElement(type: string, props: any, child: string[]) {
	return type + ' with contents: ' + child;
}
