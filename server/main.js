import { Meteor } from 'meteor/meteor';
import '../database.js'

Meteor.publish('events', function() {
	return Events.find();
})

Meteor.publish("getUserData", function () {
    return Meteor.users.find({_id: this.userId});
});

Meteor.startup(() => {
  // code to run on server at startup
});

Accounts.onCreateUser(function(options, user) {
    // We still want the default hook's 'profile' behavior.
    if (options.profile) {
        user.profile = options.profile;
        user.profile.memberSince = new Date();

        // Copy data from Facebook to user object
        user.profile.facebookId = user.services.facebook.id;
        user.profile.firstName = user.services.facebook.first_name;
        user.profile.email = user.services.facebook.email;
        user.profile.link = user.services.facebook.link;
    }

    return user;
});