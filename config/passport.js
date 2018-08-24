const User             = require("../models/user");
const passport         = require('passport');
const LocalStrategy    = require("passport-local").Strategy;
const GoogleStrategy   = require("passport-google-oauth20");
const GitHubStrategy   = require("passport-github").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

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
	usernameField: "email",
	passwordField: "password"
}, (email, password, done) => {
	User.findOne({
		email: email.toLowerCase()
	}, (err, user) => {
		if (err) {
			return done(err);
		}
		if (!user) {
			return done(null, false, {
				msg: `Email ${email} not found.`
			});
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
 * Sign in using Google Oauth 2
 */
passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	scope: ['r_basicprofile', 'r_emailaddress'],
	passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
	if (req.user) {
		User.findOne({
			google: profile.id
		}, (err, existingUser) => {
			if (err) {
				return done(err);
			}
			if (existingUser) {
				req.flash('error', 'There is already a Google account that belongs to you');
				done(err);
			} else {
				User.findById(req.user.id, (err, user) => {
					if (err) {
						return done(err);
					}
					user.google = profile.id;
					user.tokens.push({
						kind: 'google',
						accessToken
					});
					user.profile.username = user.profile.username || `${profile.name.givenName} ${profile.name.familyName}` || `${profile._json.name.givenName} ${profile._json.name.familyName}`
					user.profile.name = user.profile.name || profile.displayName;
					user.profile.gender = user.profile.gender || profile._json.gender;
					user.profile.picture = user.profile.picture || profile._json.image.url;
					user.active = 1;
					user.save((err) => {
						req.flash('success', 'Google account has been linked.');
						done(err, user);
					});
				});
			}
		});
	} else {
		User.findOne({
			google: profile.id
		}, (err, existingUser) => {
			if (err) {
				return done(err);
			}
			if (existingUser) {
				return done(null, existingUser);
			}
			User.findOne({
				email: profile.emails[0].value
			}, (err, existingEmailUser) => {
				if (err) {
					return done(err);
				}
				if (existingEmailUser) {
					req.flash('error', 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.');
					done(err);
				} else {
					const user = new User();
					user.email = profile.emails[0].value;
					user.google = profile.id;
					user.tokens.push({
						kind: 'google',
						accessToken
					});
					user.profile.username = `${profile.name.givenName} ${profile.name.familyName}` || `${profile._json.name.givenName} ${profile._json.name.familyName}`
					user.profile.name = profile.displayName;
					user.profile.gender = profile._json.gender || profile.gender;
					user.profile.picture = profile._json.image.url;
					user.active = 1;
					user.save((err) => {
						done(err, user);
					});
				}
			});
		});
	}
}));


passport.use(new FacebookStrategy({
	clientID: process.env.FACEBOOK_CLIENT_ID,
	clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
	callbackURL: process.env.FACEBOOK_CALLBACK_URL,
	profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
	passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
	if (req.user) {
		User.findOne({
			facebook: profile.id
		}, (err, existingUser) => {
			if (err) {
				return done(err);
			}
			if (existingUser) {
				req.flash('error', 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.');
				done(err);
			} else {
				User.findById(req.user.id, (err, user) => {
					if (err) {
						return done(err);
					}
					user.facebook = profile.id;
					user.tokens.push({
						kind: 'facebook',
						accessToken
					});
					user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
					user.profile.gender = user.profile.gender || profile._json.gender;
					user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
					user.active = 1;
					user.save((err) => {
						req.flash('success', 'Facebook account has been linked.');
						done(err, user);
					});
				});
			}
		});
	} else {
		User.findOne({
			facebook: profile.id
		}, (err, existingUser) => {
			if (err) {
				return done(err);
			}
			if (existingUser) {
				return done(null, existingUser);
			}
			User.findOne({
				email: profile._json.email
			}, (err, existingEmailUser) => {
				if (err) {
					return done(err);
				}
				if (existingEmailUser) {
					req.flash('error', 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.');
					done(err);
				} else {
					const user = new User();
					user.email = profile._json.email;
					user.facebook = profile.id;
					user.profile.username = profile.username || `${profile.name.givenName} ${profile.name.middleName} ${profile.name.familyName}` || `${profile._json.first_name} ${profile._json.middle_name} ${profile._json.last_name}`;
					user.tokens.push({
						kind: 'facebook',
						accessToken
					});
					user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
					user.profile.gender = profile.gender || profile._json.gender;
					user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
					user.profile.location = (profile._json.location) ? profile._json.location.name : '';
					user.active = 1;
					user.save((err) => {
						done(err, user);
					});
				}
			});
		});
	}
}));

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
	clientID: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	callbackURL: process.env.GITHUB_CALLBACK_URL,
	passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
	if (req.user) {
		User.findOne({
			github: profile.id
		}, (err, existingUser) => {
			if (existingUser) {
				req.flash('error', 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.');
				done(err);
			} else {
				User.findById(req.user.id, (err, user) => {
					if (err) {
						return done(err);
					}
					user.github = profile.id;
					user.email = user.email || profile._json.email || `${profile.username}@github.com`;
					user.tokens.push({
						kind: 'github',
						accessToken
					});
					user.profile.name = user.profile.name || profile.displayName;
					user.profile.username = user.profile.username || profile.username;
					user.profile.picture = user.profile.picture || profile._json.avatar_url;
					user.profile.location = user.profile.location || profile._json.location;
					user.profile.website = user.profile.website || profile._json.blog;
					user.active = 1;
					user.save((err) => {
						req.flash('success', 'GitHub account has been linked.');
						done(err, user);
					});
				});
			}
		});
	} else {
		User.findOne({
			github: profile.id
		}, (err, existingUser) => {
			if (err) {
				return done(err);
			}
			if (existingUser) {
				return done(null, existingUser);
			}
			User.findOne({
				email: profile._json.email
			}, (err, existingEmailUser) => {
				if (err) {
					return done(err);
				}
				if (existingEmailUser) {
					req.flash('error', 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.');
					done(err);
				} else {
					const user = new User();
					user.email = profile._json.email || `${profile.username}@github.com`;
					user.github = profile.id;
					user.tokens.push({
						kind: 'github',
						accessToken
					});
					user.profile.name = profile.displayName || profile._json.name;
					user.profile.username = profile.username;
					user.profile.picture = profile._json.avatar_url;
					user.profile.location = profile._json.location;
					user.profile.website = profile._json.blog;
					user.active = 1;

					user.save((err) => {
						done(err, user);
					});
				}
			});
		});
	}
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

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
	const provider = req.path.split('/').slice(-1)[0];
	const token = req.user.tokens.find(token => token.kind === provider);
	if (token) {
		next();
	} else {
		res.redirect(`/user/${provider}`);
	}
};