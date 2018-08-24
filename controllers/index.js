const Resturant = require('../models/resturant');
const to        = require("await-to-js").default;
const i18n      = require('i18n');
const User      = require("../models/user");


const getHome = async (req, res, next)=> {
	res.render('index', {title: 'Home'});
};

const setLang = (req, res, next)=> {
	const lang = req.params.lang;
	i18n.setLocale(res, lang, true);
	res.cookie('lang', lang);
	res.redirect('back');
};

const getListOfUsers = async (req, res, next)=> {
	const query = {};
	const options = {
		select: "profile.picture profile.name profile.picture_sm profile.picture_md profile.picture_lg email active _id role",
		page: req.params.page || 1,
		limit: 10,
		skip: (this.page * this.limit) - this.limit,
		sort: {
			created: "desc"
		},
		lean: true
	}
	const users = await User.paginate(query, options);
	if (!users.docs.length && users.offset === undefined) {
		req.flash('info', `Hey! you asked for page ${req.params.page || 1}. But that dosen't exist. So i put you on page ${users.pages}.`)
		return res.redirect(`/users/page/${users.pages}`);
	}
	res.render('users/usersList', {
		title: 'Users',
		users: users.docs,
		page: req.params.page || 1,
		pages: users.pages,
		count: users.total
	});
}

module.exports = {
	getHome,
	setLang, 
	getListOfUsers
}