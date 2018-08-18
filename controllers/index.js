const Resturant = require('../models/resturant');
const to = require("await-to-js").default;
const i18n = require('i18n');


const getHome = async (req, res, next)=> {
	const [resturantsErr, resturants] = await to(Resturant.find({}).select("name cuisine address.street _id").limit(4).sort({created: "desc"}).exec());
	if(resturantsErr) return next(resturantsErr);
	console.log(i18n.getLocale());

	res.render('index', {
		title: 'Home',
		resturants
	});
};

const setLang = (req, res, next)=> {
	const lang = req.params.lang;
	i18n.setLocale(res, lang, true);
	res.cookie('lang', lang);
	res.redirect('back');
};

const getListOfData = async (req, res, next) => {
	const query = {};
	const options = {
		select: "name cuisine address.street _id",
		page: req.params.page || 1,
		limit: 8,
		skip: (this.page * this.limit) - this.limit,
		sort: {created: "desc"},
		lean: true
	}
	const resturants = await Resturant.paginate(query, options);
	if (!resturants.docs.length && resturants.offset === undefined) {
		req.flash('info', `Hey! you asked for page ${req.params.page || 1}. But that dosen't exist. So i put you on page ${resturants.pages}.`)
		return res.redirect(`/resturants/page/${resturants.pages}`);
	}
	res.render('data/list', {
		title: 'Resturants',
		resturants: resturants.docs,
		page: req.params.page || 1,
		pages: resturants.pages,
		count: resturants.total
	});
};

module.exports = {
	getListOfData,
	getHome,
	setLang
}