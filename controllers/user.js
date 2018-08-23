const User       = require("../models/user");
const to         = require("await-to-js").default;
const mail       = require("../helpers/mail");
const nodemailer = require('nodemailer');
const passport   = require('passport');
const crypto     = require('crypto');
const _          = require('lodash');
const path       = require("path");

/**
 *  Get Login View Page
 */
const getLogin = (req, res) => {
	if (req.user) {
		return res.redirect('/');
	}
	res.render("user/login", {
		title: "login"
	});
};

/**
 * Get Registeration view page
 * @param {*} req 
 * @param {*} res 
 */
const getRegisteration = (req, res) => {
	res.render("user/register", {
		title: "register"
	});
};

/**
 * Validate Registeration data before submiting it to database.
 * validate email, name, password, confirm password.
 * if there is an errors return to registeration page with flash messages containe errors.
 * if there is no errors, continue to next middleware function.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validateRegister = async (req, res, next) => {
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
};

/**
 * parsing user data and create new user using mongoose model
 * if there is an user exists in the database, redirect back to registeration page with already exist flash message.
 * if there is no users exists in the database, save the new one, then redirect to login page to login.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const registerUser = async (req, res, next) => {
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
	User.findOne({
		email: userData.email
	}, (err, existingUser) => {
		if (err) return next(err);
		if (existingUser) {
			req.flash('error', res.__('msgs.validation.register.already_exists'));
			res.redirect('/user/register');
		}
		user.save(async (err) => {
			if (err) {
				return next(err);
			}
			const validateUrl = `http://${req.headers.host}/user/verify/${user.email}/${user.hash}`;
			const [sendMailErr, info] = await to(mail.send({
				user: user,
				filename: 'verify-user',
				subject: 'Verify User Account',
				validateUrl: validateUrl
			}));
			if (sendMailErr) return next(sendMailErr);
			req.flash("success", res.__('msgs.validation.register.success_registeration'));
			res.redirect('/');
		});
	});
};

const verifyUser = async (req, res, next) => {
	const [userError, user] = await to(User.findOneAndUpdate({
		email: req.params.email,
		hash: req.params.hash,
		active: {
			$lt: 1
		}
	}, {
		$set: {
			active: 1
		}
	}, {
		new: true,
		runValidators: true,
		context: 'query'
	}).exec());
	if (userError) return next(userError);
	if (!user) {
		req.flash('error', "Invalid approach, please use the link that has been send to your email.");
		res.redirect("/user/register");
	}
	req.logIn(user, (err) => {
		if (err) {
			return next(err);
		}
		req.flash("success", "Your account has been activated, and loggedin");
		res.redirect("/");
	});
};

/**
 * Validate Login data.
 * validate email, password.
 * if there is an errors return to login page with flash messages containe errors.
 * if there is no errors, continue to next middleware function.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validateLogin = async (req, res, next) => {
	req.checkBody('email', res.__("msgs.validation.login.email")).isEmail();
	req.checkBody('password', res.__("msgs.validation.login.password")).notEmpty();
	req.sanitize('email').normalizeEmail({
		gmail_remove_dots: false
	});

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
};

/**
 * Login user with submitted data [email, password] using passportjs package.
 * if there is no user exist in the database, redirect back to login with error flash message.
 * if there is an existing user then pass user to passportjs, then redirect back after logged in. 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const loginUser = async (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			req.flash('error', info);
			return res.redirect('/user/login');
		}
		if (user.active == 0) {
			req.flash('error', "please verify your account first so you can login!");
			return res.redirect('/user/login');
		}
		req.logIn(user, (err) => {
			if (err) {
				return next(err);
			}
			req.flash('success', res.__('msgs.validation.login.success_login'));
			res.redirect("/");
		});
	})(req, res, next);
};

/** 
 * logout user using passportjs.
 * then redirect back to root page with logout success flash message.
 */
const logoutUser = (req, res) => {
	req.logout();
	req.user = null;
	req.flash('success', res.__('msgs.validation.logout.success_logout'));
	res.redirect('/');
};

/** 
 * get Profile view page
 */
const getUserProfile = (req, res) => {
	res.render('user/profile', {
		title: `${req.user.profile.name}'s profile`,
		avatar_field: process.env.AVATAR_FIELD
	});
};

/**
 * Validate user profile data for update it.
 * if there is an error or empty data return to profile with errors flash messages
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validateUserProfile = async (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', res.__('msgs.validation.register.name')).notEmpty();
	req.checkBody('email', res.__('msgs.validation.register.email')).isEmail();
	req.sanitizeBody('email');
	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.redirect('back');
		return;
	}
	next();
};

/**
 * Update user's profile submitted data then return back to profile with new data and success flash message.
 * @param {*} req 
 * @param {*} res 
 */
const updateUserProfile = async (req, res, next) => {
	const userNewData = {
		email: req.body.email,
		profile: {
			name: req.body.name,
			username: req.body.username,
			location: req.body.location,
			gender: req.body.gender,
			website: req.body.website
		}
	}
	const [err, user] = await to(User.findOneAndUpdate({
		_id: req.user._id
	}, {
		$set: userNewData
	}, {
		new: true,
		runValidators: true,
		context: 'query'
	}).exec());
	if (err) return next(err);

	req.flash('success', res.__("msgs.validation.profile.success_basic"));
	res.redirect('back');
};

/**
 * Validate user profile password.
 * if there is errors then return back with error flash messages.
 * if there is no errors then go to next middleware.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validateUserPassword = async (req, res, next) => {
	req.checkBody('newPassword', res.__('msgs.validation.register.password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.confirm_password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.passwords_not_match')).equals(req.body.newPassword);
	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.redirect('back');
		return;
	}
	next();
};

/**
 * Update User's password, hashing new one before saveing it.
 * then return to profile with new password.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const updateUserPassword = async (req, res, next) => {
	const [err, user] = await to(User.findOne({
		_id: req.user._id
	}).exec());
	if (err) return next(err);
	user.password = req.body.newPassword;
	const [updateUserErr, updatedUser] = await to(user.save());
	if (updateUserErr) return next(updateUserErr);
	const [sendMailErr, info] = await to(mail.send({
		user: updatedUser,
		filename: 'password-updated',
		subject: 'password updated',
		email: updatedUser.email
	}));
	if (sendMailErr) return next(sendMailErr);
	req.flash('success', res.__("msgs.validation.profile.success_password"));
	res.redirect('/user/profile');
};
const updateUserAvatar = async function (req, res, next) {
	var files;
	var file = req.file.filename;
	var matches = file.match(/^(.+?)_.+?\.(.+)$/i);
	if (matches) {
		files = _.map(['lg', 'md', 'sm'], function (size) {
			return matches[1] + '_' + size + '.' + matches[2];
		});
	} else {
		files = [file];
	}
	files = _.map(files, function (file) {
		var port = req.app.get('port');
		var base = req.protocol + '://' + req.hostname + (port ? ':' + port : '');
		var url = path.join(req.file.baseUrl, file).replace(/[\\\/]+/g, '/').replace(/^[\/]+/g, '');
		return (req.file.storage == 'local' ? base : '') + '/' + url;
	});
	console.log(files)
	const [updateUserError, user] = await to(User.findOne({_id: req.user._id}));
	if(updateUserError) return next(updateUserError);
	user.profile.picture_lg = files[0];
	user.profile.picture_md = files[1];
	user.profile.picture_sm = files[2];
	const [updateUserErr, updatedUser] = await to(user.save());
	if (updateUserErr) return next(updateUserErr);
	req.flash('success', 'successfully updated your avatar.');
	res.redirect('/user/profile');

}

/**
 * Delete user profile by ID then logout.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const deleteUserAccount = async (req, res, next) => {
	const [err, user] = await to(User.findByIdAndRemove({
		_id: req.user._id
	}).exec());
	if (err) return next(err);
	req.logout();
	req.flash('success', res.__('msgs.validation.profile.success_deleted'));
	res.redirect('/');
};

const getForgot = (req, res, next) => {
	res.render("user/forgot", {
		title: "Reset Password"
	});
}

const postForgot = async (req, res, next) => {
	req.assert('email', res.__('msgs.validation.register.email')).isEmail();
	req.sanitize('email').normalizeEmail({
		gmail_remove_dots: false
	});

	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.redirect('back');
		return;
	}

	const RandomBytes = await crypto.randomBytes(16);
	const token = RandomBytes.toString('hex');
	const [findUserError, user] = await to(User.findOne({
		email: req.body.email
	}).exec());
	if (findUserError) return next(findUserError);
	if (!user) {
		req.flash('error', res.__('msgs.validations.reset.email_not_exist'));
		res.redirect('back');
	}
	user.resetPasswordToken = token;
	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
	const [updatedUserErr, updatedUser] = await to(user.save());
	if (updatedUserErr) return next(updatedUserErr);
	const resetUrl = `http://${req.headers.host}/user/reset/${updatedUser.resetPasswordToken}`;
	const [sendMailErr, info] = await to(mail.send({
		user: updatedUser,
		filename: 'password-reset',
		subject: 'password reset',
		resetUrl: resetUrl
	}));
	if (sendMailErr) return next(sendMailErr);
	req.flash('success', res.__('msgs.validation.reset.emailed_token'));
	res.redirect('/user/login');
};


const getResetPassword = (req, res, next) => {
	res.render('user/reset-password', {
		title: "Reset Password"
	});
}
const validateResetPassword = async (req, res, next) => {
	req.checkBody('password', res.__('msgs.validation.register.password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.confirm_password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.passwords_not_match')).equals(req.body.password);

	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.render("user/reset-password", {
			body: req.body,
			flashes: req.flash()
		});
		return;
	}
	next();
}
const postResetPassword = async (req, res, next) => {
	const [userErr, user] = await to(User.findOne({
		resetPasswordToken: req.params.token
	}).where("resetPasswordExpires").gt(Date.now()).exec());
	if (userErr) return next(userErr);
	if (!user) {
		req.flash('error', res.__('msgs.validation.reset.token_invlid'));
		return res.redirect('back');
	}
	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const [updateUserErr, updatedUser] = await to(user.save());
	if (updateUserErr) return next(updateUserErr);
	const [sendMailErr, info] = await to(mail.send({
		user: updatedUser,
		filename: 'password-updated',
		subject: 'password updated',
		email: updatedUser.email
	}));
	if (sendMailErr) return next(sendMailErr);
	req.flash('success', res.__('msgs.validation.reset.success_update_pass'));
	res.redirect('/user/login');
}

const oauthRedirect = (req, res, next) => {
	req.flash('success', res.__('msgs.validation.login.success_login'));
	res.redirect('/');
}

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
const getOauthUnlink = (req, res, next) => {
	const {
		provider
	} = req.params;
	User.findById(req.user.id, (err, user) => {
		if (err) {
			return next(err);
		}
		user[provider] = undefined;
		user.tokens = user.tokens.filter(token => token.kind !== provider);
		user.save((err) => {
			if (err) {
				return next(err);
			}
			req.flash('success', `${provider} account has been unlinked.`);
			res.redirect('/user/profile');
		});
	});
};

/**
 * Exporting all functions
 */
module.exports = {
	getLogin,
	getRegisteration,
	validateRegister,
	registerUser,
	validateLogin,
	loginUser,
	logoutUser,
	getUserProfile,
	validateUserProfile,
	updateUserProfile,
	validateUserPassword,
	updateUserPassword,
	updateUserAvatar,
	deleteUserAccount,
	getForgot,
	postForgot,
	getResetPassword,
	postResetPassword,
	validateResetPassword,
	verifyUser,
	oauthRedirect,
	getOauthUnlink
}