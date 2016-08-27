export default class Greeter {
	constructor(public greeting: string) { }
	greet() {
		return "<h1>" + this.greeting + "</h1>";
	}
};
