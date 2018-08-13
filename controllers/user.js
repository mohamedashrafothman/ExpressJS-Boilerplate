const User = require("../models/user");
const to = require("await-to-js").default;
const passport = require('passport');

module.exports = {
	getLogin: (req, res)=> {
		 if (req.user) {
		 	return res.redirect('/');
		 }
		res.render("user/login", {title: "login"});
	},
	getRegisteration: (req, res)=> {
		res.render("user/register", {title: "register"});
	},
	validateRegister: async (req, res, next)=> {
		// express-validation method from methods that validator asssign to request
		req.sanitizeBody('name');
		req.checkBody('name', res.__('msgs.validation.register.name')).notEmpty();
		req.checkBody('email', res.__('msgs.validation.register.email')).isEmail();
		req.sanitizeBody('email');
		req.checkBody('password', res.__('msgs.validation.register.password')).notEmpty();
		req.checkBody('confirmPassword', res.__('msgs.validation.register.confirm_password')).notEmpty();
		req.checkBody('confirmPassword', res.__('msgs.validation.register.passwords_not_match')).equals(req.body.password);

		const errors = await req.getValidationResult();
		if (!errors.isEmpty()) {
			var err = errors.array();
			req.flash('error', err);
			res.render('user/register', {
				title: res.__('titles.register'),
				body: req.body,
				flashes: req.flash()
			});
			return;
		}
		next();
	},
	registerUser: async (req, res, next)=> {

		const userData = {
			profile: {
				name: req.body.name,
				username: req.body.username
			},
			email: req.body.email,
			password: req.body.password,
			confirmPassword: req.body.confirmPassword
		}
		const user = new User(userData);
		User.findOne({email: userData.email}, (err, existingUser)=> {
			if(err) return next(err);
			if (existingUser) {
				req.flash('error', res.__('msgs.validation.register.already_exists'));
				res.redirect('/user/register');
			}
			user.save((err) => {
				if (err) {return next(err);}
				req.flash("success", res.__('msgs.validation.register.success_registeration'));
				res.redirect('/user/login');
			});
		});	
	},
	validateLogin: async (req, res, next)=> {
		// validate user data
		req.checkBody('email', res.__("msgs.validation.login.email")).isEmail();
		req.checkBody('password', res.__("msgs.validation.login.password")).notEmpty();
		req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

		const errors = await req.getValidationResult();
		if (!errors.isEmpty()) {
			var err = errors.array();
			req.flash('error', err);
			res.render('user/login', {
				title: res.__("titles.login"),
				body: req.body,
				flashes: req.flash()
			});
			return;
		}
		next();
	},
	loginUser: async (req, res, next)=> {
		 passport.authenticate('local', (err, user, info) => {
		 	if (err) {
		 		return next(err);
		 	}
		 	if (!user) {
		 		req.flash('error', info);
		 		return res.redirect('/user/login');
				
		 	}
		 	req.logIn(user, (err) => {
		 		if (err) {
		 			return next(err);
		 		}
		 		req.flash('success', res.__('msgs.login.success_login'));
		 		res.redirect('/');
		 	});
		 })(req, res, next);
	},
	logoutUser: (req, res)=> {
		req.logout();
		req.user = null;
		req.flash('success', res.__('msgs.logout.success_logout'));
		res.redirect('/');
	}
}