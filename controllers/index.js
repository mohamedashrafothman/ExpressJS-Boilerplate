const Resturant = require('../models/resturant');

const getHome = async (req, res, next)=> {
	res.render('index', {
		title: 'Home'
	});
};

const setLang = (req, res, next)=> {
	const lang = req.params.lang;
	res.cookie('lang', lang);
	res.redirect('/');
};

const getListOfData = async (req, res, next) => {
	const page = req.params.page || 1;
	const limit = 6;
	const skip = (page * limit) - limit;
	const resturants = await Resturant.find().skip(skip).limit(limit).sort({
		created: 'desc'
	}).exec();
	const count = await Resturant.count();
	const pages = Math.ceil(count / limit);
	if (!resturants.length && skip) {
		req.flash('info', `Hey! you asked for page ${page}. But that dosen't exist. So i put you on page ${pages}.`)
		res.redirect(`/resturants/page/${pages}`);
		return;
	}
	res.render('data/list', {
		title: 'Resturants',
		resturants,
		page,
		pages,
		count
	});
};

module.exports = {
	getListOfData,
	getHome,
	setLang
}