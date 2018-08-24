/**
 ** ============================= Dependencies ============================== 
 ** =========================================================================
 *? Require dotenv package first then everything else
 */
require("dotenv/config");
const _ = require("lodash");
const path = require("path");
const i18n = require("i18n");
const csrf = require('csurf');
const flash = require('connect-flash');
const chalk = require("chalk");
const logger = require("morgan");
const express = require('express');
const favicon = require('serve-favicon');
const mongoose = require("mongoose");
const passport = require("passport");
const userRoute = require("./routes/user");
const indexRoute = require("./routes/index");
const bodyParser = require("body-parser");
const permission = require("permission");
const errorHandler = require('errorhandler');
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const generalHelpers = require('./helpers/general');
const expressValidator = require("express-validator");

/**
 ** ============================ Configurations =============================
 ** =========================================================================
 * todo: make all configurations in seprate files, then require them.
 */
require('./config/passport');
i18n.configure({
	locales: ['en', 'ar'],
	cookie: 'lang',
	directory: __dirname + '/languages',
	register: global,
	objectNotation: true,
});

/**
 ** ========================== Create App Instance ========================== 
 ** ========================================================================= 
 */
const app = express();

/**
 ** ========================== MongoDB Connection =========================== 
 ** ========================================================================= 
 */
mongoose.connect(process.env.MONGODB_URI, {
	useNewUrlParser: true
});
mongoose.connection.once("open", () => {
	console.log(chalk.blue.bold("conencted to the database"));
}).on("error", (error) => {
	console.error(error);
	console.log(`${chalk.red('✗')} MongoDB connection error. Please make sure MongoDB is running.`);
	process.exit();
});

/** 
 ** ============================== Middlewares ============================== 
 ** =========================================================================
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views/'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public/build/')));
app.use(favicon(path.join(__dirname, 'public/build/images', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(expressValidator());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(cookieSession({
	name: 'session',
	secret: process.env.SESSION_SECRET,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 14 // 1000 ms * 60 s * 60 min * 24 h * 14 day = 14 Days
	},
}));
app.use(passport.initialize());
app.use(passport.session());
// todo: handle other security technuiqes, not only CSRF.
app.use(csrf({
	cookie: true
}))
app.use(flash());
app.use(i18n.init);
app.set('permission', {
	role: 'role',
	notAuthenticated: {
		flashType: 'error',
		message: 'Login first so you can access your requested page.',
		redirect: '/user/login'
	},
	notAuthorized: {
		flashType: 'error',
		message: "You are not allowed to see this content, only admins can see it.",
		redirect: 'back'
	}
});
app.use((req, res, next) => {
	res.locals.h = generalHelpers;
	res.locals._ = _;
	res.locals.siteName = process.env.SITE_NAME
	res.locals.flashes = req.flash() || null;
	res.locals.user = req.user || null;
	res.locals.lang = req.cookies.lang || req.setLocale('en') || 'en';
	res.locals.csrfToken = req.csrfToken();
	next();
});
app.use((req, res, next) => {
	// After successful login, redirect back to the intended page
	if (!req.user && req.path !== '/user/login' && req.path !== '/user/register' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
		req.session.returnTo = req.originalUrl;
	} else if (req.user && (req.path === '/user/profile' || req.path.match(/^\/api/))) {
		req.session.returnTo = req.originalUrl;
	}
	next();
});

/**
 ** ================================ Routes ================================= 
 ** =========================================================================
 */
app.use("/", indexRoute);
app.use("/user", userRoute);


/**
 ** ============================ Error Handling ============================= 
 ** =========================================================================
 */
if (process.env.NODE_ENV === 'development') {
	app.use(errorHandler());
}

/**
 ** =========================== Listen To Server ============================
 ** =========================================================================
 */
app.listen(app.get('port'), () => {
	console.log(`${chalk.green('✓')} App is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`);
	console.log('  Press CTRL-C to stop\n');
});

module.exports = app;