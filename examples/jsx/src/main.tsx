import * as React from 'react';
import { render } from 'react-dom';

import Greeter from './Greeter';

render((
	<Greeter greeting="Hello, world!" />
), document.getElementById('app'));
