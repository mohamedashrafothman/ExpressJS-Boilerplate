const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");


passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user);
	});
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({
	usernameField: 'email'
}, (email, password, done) => {
	User.findOne({email: email.toLowerCase()}, (err, user) => {
		if (err) {return done(err);}
		if (!user) {
			return done(null, false, {msg: `Email ${email} not found.`});
		}
		user.comparePassword(password, (err, isMatch) => {
			if (err) {
				return done(err);
			}
			if (isMatch) {
				return done(null, user);
			}
			return done(null, false, {
				msg: 'Invalid email or password.'
			});
		});
	});
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash('warning', 'make sure you are logged in first!')
	res.redirect('/user/login');
};