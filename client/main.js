import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

FlowRouter.route('/', {
	name: 'Home',
	action() {
		console.log('swag');
	}
})