const i18n = require('i18n');
const User = require("../models/user");

const getHome = async (req, res, next) => {
	res.render('index', {
		title: 'Home'
	});
};

const setLang = (req, res, next) => {
	const lang = req.params.lang;
	i18n.setLocale(res, lang, true);
	res.cookie('lang', lang);
	res.redirect('back');
};

const getListOfUsers = async (req, res, next) => {
	const query = {
		role: {
			$nin: ["superAdmin", "admin"]
		}
	};
	const options = {
		select: "profile.picture profile.name profile.slug profile.picture_sm profile.picture_md profile.picture_lg email active _id role",
		page: req.params.page || 1,
		limit: 10,
		skip: (this.page * this.limit) - this.limit,
		sort: {
			created: "desc"
		},
		lean: true
	}
	const users = await User.paginate(query, options);
	if (!users.docs.length && users.offset === undefined & users.page !== 1) {
		req.flash('info', `Hey! you asked for page ${req.params.page || 1}. But that dosen't exist. So i put you on page ${users.pages}.`)
		return res.redirect(`/users`);
	}
	res.render('users/list', {
		title: res.__("titles.users"),
		users: users.docs,
		page: req.params.page || 1,
		pages: users.pages,
		count: users.total,
		baseUrl: "/users"
	});
}
const getListOfAdmins = async (req, res, next) => {
	const query = {
		role: {
			$nin: ["superAdmin", "user"]
		}
	};
	const options = {
		select: "profile.picture profile.name profile.slug profile.picture_sm profile.picture_md profile.picture_lg email active _id role",
		page: req.params.page || 1,
		limit: 10,
		skip: (this.page * this.limit) - this.limit,
		sort: {
			created: "desc"
		},
		lean: true
	}
	const users = await User.paginate(query, options);
	if (!users.docs.length && users.offset === undefined && users.page !== 1) {
		console.log(users);
		req.flash('info', `Hey! you asked for page ${req.params.page || 1}. But that dosen't exist. So i put you on page ${users.pages}.`)
		return res.redirect(`/admins`);
	}
	res.render('users/list', {
		title: res.__("titles.admins"),
		users: users.docs,
		page: req.params.page || 1,
		pages: users.pages,
		count: users.total,
		baseUrl: "/admins"
	});
};


module.exports = {
	getHome,
	setLang,
	getListOfUsers,
	getListOfAdmins
}