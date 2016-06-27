import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import './layouts/signinup.html';
import './layouts/home.html';
import './layouts/teach.html';
import '../database.js';

Meteor.subscribe('events');
Meteor.subscribe("getUserData");

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
        console.log(Meteor.user().profile.name);
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

Template.signinup.events({
    'click #button': function(event) {
        Meteor.loginWithFacebook({ requestPermissions: ['email', 'public_profile', 'user_friends', 'user_likes'] }, function(err) {
            if (err) {
                throw new Meteor.Error("Facebook login failed");
            }
            console.log(Meteor.user().profile.name);
        });
    }
});

Template.page.events({
    'click .join': function(event) {
        alert('what the fuck')
    }
});

Template.main.helpers({
    currentUser: function() {
        return Meteor.user();
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
            if (events[a].peoplegoing.indexOf(Meteor.user().services.facebook.id) > -1) {
                events[a].notjoined = false;
            } else {
                events[a].notjoined = true;
            }
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
    current: Meteor.user(),
    img: 'http://graph.facebook.com/' + Meteor.user().services.facebook.id + '/picture/?type=large',
    classes: function() {
        events = Events.find({ peoplegoing: Meteor.user().services.facebook.id })
        for (var a = 0; a < events.length; a++) {
            events[a].date = moment(events[a].date).calendar()
            events[a].id = events[a]._id.str;
            if (events[a].peoplegoing.indexOf(Meteor.user().services.facebook.id) > -1) {
                events[a].notjoined = true;
            } else {
                events[a].notjoined = false;
            }
        }
        return events;
    }
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
            peoplegoing: [Meteor.user().services.facebook.id],
            subject: subject,
            date: date,
            teacher: teacher,
            now: now
        });
        if (things + 1 == Events.find().fetch().length) {
            console.log('swagga')
        }
        FlowRouter.go('/')
    },
    'click #setlocation': function() {
        console.log($("[name='class']").val());
        console.log($("[name='date']").val());
        console.log(document.getElementById("test5").checked);
        Session.set('class', $("[name='class']").val());
        Session.set('date', $("[name='date']").val());
        Session.set('private', document.getElementById("test5").checked);
        FlowRouter.go('/map')
    }
});

Template.add.onRendered(function() {
    $("[name='class']").val(Session.get('class'));
    $("[name='date']").val(Session.get('date'));
    document.getElementById("test5").checked = Session.get('private')
    console.log(Session.get('coords'))
})

Template.map.onRendered(function() {
    alert('Place the X where you would like to meet. Try to zoom in, and then press the back button to save')
});
