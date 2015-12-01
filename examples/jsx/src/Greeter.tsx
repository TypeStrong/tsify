import * as React from 'react';

export interface IGreeterProps {
	greeting: string;
}

export default class Greeter extends React.Component<IGreeterProps, any> {
	render() {
		const { greeting } = this.props;
		return (
			<h1>{ greeting }</h1>
		);
	}
};
