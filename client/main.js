import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import './layouts/signinup.html';
import './layouts/home.html';
import './layouts/teach.html';
import '../database.js';

Meteor.subscribe('events');
Meteor.subscribe("getUserData");

var userGeoLocation = new ReactiveVar(null);

Tracker.autorun(function(computation) {
    userGeoLocation.set(Geolocation.latLng());
    if (userGeoLocation.get()) {
        //stop the tracker if we got something
        console.log(userGeoLocation)
        computation.stop();
        Session.set('loc', userGeoLocation)
    }
});

FlowRouter.route('/', {
    name: 'signinup',
    action() {
        console.log('Sign In/Up')
        console.log(Meteor.user().profile.name);
    }
});

FlowRouter.route('/home', {
    name: 'home',
    action() {
        BlazeLayout.render('home')
    }
});

FlowRouter.route('/add', {
    name: 'add',
    action() {
        console.log('add!')
    }
});

FlowRouter.route('/map', {
    name: 'map',
    action() {
        console.log('map')
    }
});

FlowRouter.route('/profile', {
    name: 'profile',
    action() {
        console.log(Session.get('user'));
    }
});

FlowRouter.route('/teach/:class', {
    name: 'teach',
    action() {
        console.log('teach')
    }
});

FlowRouter.route('/submit/:class', {
    name: 'submit',
    action() {
        Events.update({ _id: FlowRouter.getParam('class') }, { $set: { teacher: Meteor.userId(), qualifications: FlowRouter.getQueryParam('qualifications') } });
        alert('We got your request and notified the poster!')
        FlowRouter.go('/')
    }
});

FlowRouter.route('/directions/:coords', {
    name: 'directions',
    action() {
        console.log('http://maps.google.com/maps?z=12&t=m&q=loc:'+FlowRouter.getParam('coords')+'&output=embed');
    }
});     

Template.signinup.events({
    'click #button': function(event) {
        Meteor.loginWithFacebook({}, function(err) {
            if (err) {
                throw new Meteor.Error("Facebook login failed");
            }
        });
    },

    'click #logout': function(event) {
        Meteor.logout(function(err) {
            if (err) {
                throw new Meteor.Error("Logout failed");
            }
        })
    }
});


Template.page.events({
    'click .join': function(event) {
        alert('what the fuck')
    }
});

Template.main.helpers({
    currentUser: function() {
    	if(!Session.get('user')) {
    		Session.set('user', Meteor.user())
    		return Meteor.user();
    	}
    	else
    	{
    		return Session.get('user')
    	}
    },
    profpic: function() {
        console.log('http://graph.facebook.com/'+Session.get('user').profile.facebookId+'/picture/?type=large')
        return 'http://graph.facebook.com/'+Session.get('user').profile.facebookId+'/picture/?type=large'
    }
})

Template.home.helpers({
    template: function() {
        if (ActiveRoute.path(new RegExp('add'))) {
            return 'add'
        } else if (ActiveRoute.path(new RegExp('map'))) {
            return 'map'
        } else if (ActiveRoute.path(new RegExp('profile'))) {
            return 'profile'
        } else if (ActiveRoute.path(new RegExp('teach'))) {
            return 'teach'
        } else if (ActiveRoute.path(new RegExp('directions'))) {
            return 'directions'
        } else {
            return 'page'
        }
    },
    map: function() {
        if (ActiveRoute.path(new RegExp('map'))) {
            return false;
        } else {
            return true;
        }
    },
    home: function() {
        if (ActiveRoute.path('/')) {
            return true;
        } else {
            return false;
        }
    }
});

Template.page.helpers({
    things: function() {
        events = Events.find().fetch()
        for (var a = 0; a < Events.find().fetch().length; a++) {
            events[a].date = moment(events[a].date).calendar()
            events[a].id = events[a]._id.str;
            if (events[a].peoplegoing.indexOf(Meteor.user().profile.facebookId) > -1) {
                events[a].notjoined = false;
            } else {
                events[a].notjoined = true;
            }
            events[a].lat = events[a].loc.coordinates[1]
            events[a].lng = events[a].loc.coordinates[0]
        }
        return events;
    },
})

Template.add.helpers({
    immediate: function() {
        if (Session.get('immediate')) {
            return 'Immediate'
        } else {
            return 'Appointment'
        }
    },
    test: function() {
        return !Session.get('immediate')
    }
});

Template.map.helpers({
    exampleMapOptions: function() {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded() && Session.get('lat') && Session.get('lon')) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(parseFloat(Session.get('lat')), parseFloat(Session.get('lon'))),
                zoom: 8
            };
        }
    }
});

Template.teach.helpers({
    class: function() {
        return Events.findOne(FlowRouter.getParam("class")).subject
    },
    classid: function() {
        return FlowRouter.getParam('class')
    },
    user: function() {
        return Meteor.userId();
    },
    picture: function() {
        user = Meteor.user()
        console.log(user.profile.picture)
    }
})

Template.profile.helpers({
    classes: function() {
        events = Events.find({ peoplegoing: Meteor.user().profile.facebookId })
        for (var a = 0; a < events.length; a++) {
            events[a].date = moment(events[a].date).calendar()
            events[a].id = events[a]._id.str;
            if (events[a].peoplegoing.indexOf(Meteor.user().profile.facebookId) > -1) {
                events[a].notjoined = true;
            } else {
                events[a].notjoined = false;
            }
        }
        return events;
    }
});

Template.directions.helpers({
    url: 'https://maps.google.com?saddr=Current+Location&daddr='+FlowRouter.getParam('coords').split(',')[0]+','+FlowRouter.getParam('coords').split(',')[1]+'&output=embed'
})

Template.add.events({
    'submit #add': function(event) {
        event.preventDefault();
        lat = parseFloat(Session.get('coords').split(',')[0]);
        lon = parseFloat(Session.get('coords').split(',')[1]);
        subject = $("[name='class']").val();
        date = $("[name='date']").val();
        teacher = false;
        now = Session.get('immediate');
        student = Meteor.userId();
        things = Events.find().fetch().length
        Events.insert({
            student: student,
            loc: { type: "Point", coordinates: [lon, lat] },
            peoplegoing: [Meteor.user().profile.facebookId],
            subject: subject,
            date: date,
            teacher: teacher,
            now: now
        });
        if (things + 1 == Events.find().fetch().length) {
            console.log('swagga')
        }
        FlowRouter.go('/')
    }
});

Template.map.onRendered(function() {
    alert('Place the X where you would like to meet. Try to zoom in, and then press the back button to save')
});
