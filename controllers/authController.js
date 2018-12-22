const _        = require('lodash');
const to       = require("await-to-js").default;
const User     = require("../models/user");
const path     = require("path");
const mail     = require("../helpers/mail");
const crypto   = require('crypto');
const passport = require('passport');
const utilityHelper = require("../helpers/utility.js");


//
// ─── GET LOGIN VIEW ─────────────────────────────────────────────────────────────
//
const getLogin = (req, res) => {
	if (req.user) { return res.redirect('/'); } // checking fo user if loged in, if so return to home page
	res.render("auth/login", { title: "login" });
};


//
// ─── GET REGISTERATION VIEW ─────────────────────────────────────────────────────
//
const getRegisteration = (req, res) => {
	res.render("auth/register", {
		title: "register"
	});
};


//
// ─── VALIDATE REGISTERATION ─────────────────────────────────────────────────────
//
const validateRegister = async (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', res.__('msgs.validation.register.name')).notEmpty();
	req.checkBody('email', res.__('msgs.validation.register.email')).isEmail();
	req.sanitizeBody('email');
	req.checkBody('password', res.__('msgs.validation.register.password')).notEmpty();
	req.checkBody('password', `Password must be ${Number(process.env.MINIMUM_PASSWORD_LENGTH)} char Length.`)
	   .isLength({ min: Number(process.env.MINIMUM_PASSWORD_LENGTH) });
	req.checkBody("password", "password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
	req.checkBody('confirmPassword', res.__('msgs.validation.register.confirm_password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.passwords_not_match')).equals(req.body.password);

	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.render('auth/register', {
			title: res.__('titles.register'),
			body: req.body,
			flashes: req.flash()
		});
		return;
	}
	next();
};


//
// ─── REGISTERATION ──────────────────────────────────────────────────────────────
//
const registerUser = async (req, res, next) => {
	const userData = {
		profile: {
			name: req.body.name,
			username: req.body.username
		},
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		role: (() => {
			if (!req.body.adminCode) {
				return "user";
			} else if (req.body.adminCode && _.isEqual(req.body.adminCode, process.env.ADMIN_SECRET)) {
				return "admin"
			} else if (req.body.adminCode && _.isEqual(req.body.adminCode, process.env.SUPER_ADMIN_SECRET)) {
				return "superAdmin"
			} else {
				return "";
			}
		})()
	}
	const user = new User(userData);
	User.findOne({ email: userData.email }, (err, existingUser) => {
		if (err) return next(err);
		if (existingUser) {
			req.flash('error', res.__('msgs.validation.register.already_exists'));
			res.redirect('/auth/register');
		}
		user.save(async (err) => {
			if (err) return next(err);
			// Send email including verification code
			const validateUrl = `http://${req.headers.host}/auth/verify/${user.email}/${user.hash}`;
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


//
// ─── VERIFING USER ──────────────────────────────────────────────────────────────
//
const verifyUser = async (req, res, next) => {
	const [userError, user] = await to(User.findOneAndUpdate({
		email : req.params.email,
		hash  : req.params.hash,
		active: { $lt: 1 }
	}, {
		$set:
			{ active: 1 }
		}, {
			new          : true,
			runValidators: true,
			context      : 'query'
		}).exec());
	if (userError) return next(userError);
	if (!user) {
		req.flash('error', "Invalid approach, please use the link that has been send to your email.");
		res.redirect("/auth/register");
	}
	req.flash("success", "Your account has been Verified");
	res.redirect("/auth/login");
};


//
// ─── VALIDATE LOGIN ─────────────────────────────────────────────────────────────
//
const validateLogin = async (req, res, next) => {
	req.checkBody('email', res.__("msgs.validation.login.email")).isEmail();
	req.checkBody('password', res.__("msgs.validation.login.password")).notEmpty();
	req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.render('auth/login', {
			title: res.__("titles.login"),
			body: req.body,
			flashes: req.flash()
		});
		return;
	}
	next();
};


//
// ─── LOGIN ──────────────────────────────────────────────────────────────────────
//
const loginUser = async (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			req.flash('error', info);
			return res.redirect('/auth/login');
		}
		// ! uncomment this if you want user to be blocked from loggin as he is not verified yet
		// if (user.active == 0) {
		// 	req.flash('error', "please verify your account first so you can login, or check the problem with system admin.");
		// 	return res.redirect('/auth/login');
		// }
		req.logIn(user, (err) => {
			if (err) {
				return next(err);
			} else {
				if (req.body.remember) {
					let expire = 1000 * 60 * 60 * process.env.COKKIES_MAXAGE_IN_HOURS;
					req.session.cookie.expires = new Date(Date.now() + expire);
					req.session.cookie.maxAge = expire;
				} else {
					req.session.cookie.expires = false;
				}
				req.flash('success', res.__('msgs.validation.login.success_login'));
				res.redirect("/");
			}
		});
	})(req, res, next);
};


//
// ─── LOGOUT ─────────────────────────────────────────────────────────────────────
//
const logoutUser = (req, res) => {
	req.logout();
	req.user = null;
	req.flash('success', res.__('msgs.validation.logout.success_logout'));
	res.redirect('/');
};


//
// ─── PROFILE VIEW ───────────────────────────────────────────────────────────────
//
const getUserProfile = async (req, res, next) => {
	const [gettingUserErr, user] = await to(User.findOne({
		"slug": req.params.name
	}).exec());
	if (gettingUserErr) return next(gettingUserErr);
	if (!user) {
		req.flash("error", "No user found with this name");
		return res.redirect("/");
	}
	return res.render("auth/profile", {
		title: `${user.profile.username}'s profile`,
		avatar_field: process.env.AVATAR_FIELD,
		userData: user
	});
};


//
// ─── VALIDATE BASIC USER PROFILE ────────────────────────────────────────────────
//
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



//
// ─── UPDATE USER BASIC DATA ─────────────────────────────────────────────────────
//
const updateUserProfile = async (req, res, next) => {
	let [gettingUserErr, user] = await to(User.findOne({_id: req.params.id}).exec());
	if (gettingUserErr) return next(gettingUserErr);

	user.email              = req.body.email;
	user.profile.name       = req.body.name;
	user.profile.gender     = req.body.gender;
	user.profile.website    = req.body.website;
	user.profile.username   = req.body.username;
	user.profile.location   = req.body.location;
	user.profile.picture    = (user.profile.picture) ? user.profile.picture : '',
	user.profile.picture_sm = (user.profile.picture_sm) ? user.profile.picture_sm : '',
	user.profile.picture_md = (user.profile.picture_md) ? user.profile.picture_md : '',
	user.profile.picture_lg = (user.profile.picture_lg) ? user.profile.picture_lg : ''

	let [updatingUserErr, updatedUser] = await to(user.save());
	if (updatingUserErr) return next(updatingUserErr);

	req.flash('success', res.__("msgs.validation.profile.success_basic"));
	res.redirect(`/auth/profile/${updatedUser.slug}`);
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
	req.checkBody('newPassword', `Password must be ${Number(process.env.MINIMUM_PASSWORD_LENGTH)} char Length.`)
		.isLength({
			min: Number(process.env.MINIMUM_PASSWORD_LENGTH)
		});
	req.checkBody("newPassword", "password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
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
	res.redirect(`/auth/profile/${updatedUser.slug}`);
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
	const [updateUserError, user] = await to(User.findOne({
		_id: req.params.id
	}));
	if (updateUserError) return next(updateUserError);
	user.profile.picture_lg = files[0];
	user.profile.picture_md = files[1];
	user.profile.picture_sm = files[2];
	const [updateUserErr, updatedUser] = await to(user.save());
	if (updateUserErr) return next(updateUserErr);
	req.flash('success', 'successfully updated your avatar.');
	res.redirect(`/auth/profile/${updatedUser.slug}`);

}

/**
 * Delete user profile by ID then logout.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteUserAccount = async (req, res, next) => {
	const [err, user] = await to(User.findByIdAndRemove({
		_id: req.params.id
	}).exec());
	if (err) return next(err);
	req.flash('success', res.__('msgs.validation.profile.%s success_deleted', user.profile.name));
	res.redirect("/");
};

const getForgot = (req, res, next) => {
	res.render("auth/forgot", {
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
	const token = utilityHelper.createRandomToken(16);
	const [findUserError, user] = await to(User.findOne({
		email: req.body.email
	}).exec());
	if (findUserError) return next(findUserError);
	if (!user) {
		req.flash('error', res.__('msgs.validations.reset.email_not_exist'));
		res.redirect('back');
	}
	user.resetPasswordToken = token;
	user.resetPasswordExpires = Date.now() + (1000 * 60 * 60 * process.env.PASSWORD_RESET_TIME_LIMIT_IN_HOURS); // 1000 ms * 60 s * 60 min * hours number
	const [updatedUserErr, updatedUser] = await to(user.save());
	if (updatedUserErr) return next(updatedUserErr);
	const resetUrl = `http://${req.headers.host}/auth/reset/${updatedUser.resetPasswordToken}`;
	const [sendMailErr, info] = await to(mail.send({
		user: updatedUser,
		filename: 'password-reset',
		subject: 'password reset',
		resetUrl: resetUrl
	}));
	if (sendMailErr) return next(sendMailErr);
	req.flash('success', res.__('msgs.validation.reset.emailed_token'));
	res.redirect('/auth/login');
};


const getResetPassword = (req, res, next) => {
	res.render('auth/reset-password', {
		title: "Reset Password"
	});
}
const validateResetPassword = async (req, res, next) => {
	req.checkBody('password', res.__('msgs.validation.register.password')).notEmpty();
	req.checkBody('password', `Password must be ${Number(process.env.MINIMUM_PASSWORD_LENGTH)} char Length.`)
		.isLength({
			min: Number(process.env.MINIMUM_PASSWORD_LENGTH)
		});
	req.checkBody("password", "password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
	req.checkBody('confirmPassword', res.__('msgs.validation.register.confirm_password')).notEmpty();
	req.checkBody('confirmPassword', res.__('msgs.validation.register.passwords_not_match')).equals(req.body.password);

	const errors = await req.getValidationResult();
	if (!errors.isEmpty()) {
		var err = errors.array();
		req.flash('error', err);
		res.render("auth/reset-password", {
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
	res.redirect('/auth/login');
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
	const {provider} = req.params;
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
			res.redirect(`/auth/profile/${user.slug}`);
		});
	});
};

/**
 * Exporting all functions
 */
module.exports = {
	getLogin,
	loginUser,
	getForgot,
	postForgot,
	logoutUser,
	verifyUser,
	registerUser,
	oauthRedirect,
	validateLogin,
	getOauthUnlink,
	getUserProfile,
	getRegisteration,
	updateUserAvatar,
	validateRegister,
	getResetPassword,
	updateUserProfile,
	deleteUserAccount,
	postResetPassword,
	updateUserPassword,
	validateUserProfile,
	validateUserPassword,
	validateResetPassword
}