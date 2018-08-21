/**
 ** Requiring Dependencies
 */
const express          = require('express');
const path             = require("path");
const logger           = require("morgan");
const mongoose         = require("mongoose");
const cookieSession    = require("cookie-session");
const cookieParser     = require("cookie-parser");
const errorHandler     = require('errorhandler');
const flash            = require('connect-flash');
const bodyParser       = require("body-parser");
const expressValidator = require("express-validator");
const passport         = require("passport");
const csrf             = require('csurf');
const chalk            = require("chalk");
const i18n             = require("i18n");
const dotenv           = require("dotenv");
const favicon          = require('serve-favicon');
const indexRoute       = require("./routes/index");
const userRoute        = require("./routes/user");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({
	path: '.env'
});

/**
 * Configurations
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
 ** create app
 */
const app = express();

/**
 ** MongoDB connection
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
 ** Middlewares
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
		maxAge: 1209600000 // two weeks in milliseconds
	}, 
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf({
	cookie: true
}))
app.use(flash());
app.use(i18n.init);
app.use((req, res, next) => {
	res.locals.title     = 'Express Starter Env.';
	res.locals.flashes   = req.flash() || null;
	res.locals.user      = req.user || null;
	res.locals.lang      = req.cookies.lang || req.setLocale('en') || 'en';
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
 ** Routing
 */
app.use("/", indexRoute);
app.use("/user", userRoute);


/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
	// only use in development
	app.use(errorHandler());
}


/**
 ** Listing to the server
 */
app.listen(app.get('port'), () => {
	console.log(`${chalk.green('✓')} App is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`);
	console.log('  Press CTRL-C to stop\n');
});

module.exports = app;