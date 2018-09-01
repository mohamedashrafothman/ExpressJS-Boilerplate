/**
 ** ============================= Dependencies ============================== 
 ** =========================================================================
 *? Require dotenv package first then everything else
 */
require("dotenv/config");
const _ = require("lodash");
const path = require("path");
const i18n = require("i18n");
const lusca = require("lusca");
const flash = require('connect-flash');
const chalk = require("chalk");
const logger = require("morgan");
const express = require('express');
const favicon = require('serve-favicon');
const session = require('express-session');
const mongoose = require("mongoose");
const passport = require("passport");
const MongoStore = require('connect-mongo')(session);
const bodyParser = require("body-parser");
const permission = require("permission");
const compression = require("compression");
const errorHandler = require('errorhandler');
const cookieParser = require("cookie-parser");
const generalHelpers = require('./helpers/general');
const expressValidator = require("express-validator");

/**
 ** ============================ Configurations =============================
 ** =========================================================================
 * ? make sure that all configuration must be replaced in config folder
 */
require('./config/passportConfig');
require('./config/i18nConfig');

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
app.use(compression())
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(expressValidator());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: false, // don't create session until something stored
	resave: false, //don't save session if unmodified
	cookie : { maxAge: 1209600000 },       // two weeks in milliseconds
	store: new MongoStore({
		url: process.env.MONGODB_URI,
		ttl: 14 * 24 * 60 * 60, // 60 s * 60 min * 24 h * 14 day = 14 Days,
		autoReconnect: true
	})
}));

// passport needs to come after session initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(i18n.init);
app.set('permission', {
	role: 'role',
	notAuthenticated: {
		flashType: 'error',
		message: 'Login first so you can access your requested page.',
		redirect: '/auth/login',
		status: 401
	},
	notAuthorized: {
		flashType: 'error',
		message: "You are not allowed to see this content, only admins can see it.",
		redirect: 'back',
		status: 403
	}
});
app.use(lusca.csrf());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');

// pass the Globals to all responses
app.use((req, res, next) => {
	res.locals.h         = generalHelpers;
	res.locals._         = _;
	res.locals.siteName  = process.env.SITE_NAME
	res.locals.flashes   = req.flash() || null;
	res.locals.user      = req.user || null;
	res.locals.lang      = req.cookies.lang || req.setLocale('en') || 'en';
	res.locals.csrfToken = req.csrfToken();
	next();
});
app.use((req, res, next) => {
	// After successful login, redirect back to the intended page
	if (!req.user && req.path !== '/auth/login' && req.path !== '/auth/register' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
		req.session.returnTo = req.originalUrl;
	} else if (req.user && (req.path === '/auth/profile' || req.path.match(/^\/api/))) {
		req.session.returnTo = req.originalUrl;
	}
	next();
});


/**
 ** ================================ Routes ================================= 
 ** =========================================================================
 */
const userRoute = require("./routes/authRoute");
const indexRoute = require("./routes/indexRoute");
app.use("/", indexRoute);
app.use("/auth", userRoute);


/**
 ** ============================ Error Handling ============================= 
 ** =========================================================================
 */
// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

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