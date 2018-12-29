/*
	      █████╗ ██████╗ ██████╗         ██╗███████╗
	    ██╔══██╗██╔══██╗██╔══██╗        ██║██╔════╝
	   ███████║██████╔╝██████╔╝        ██║███████╗
	  ██╔══██║██╔═══╝ ██╔═══╝    ██   ██║╚════██║
 	 ██║  ██║██║     ██║     ██╗╚█████╔╝███████║
	╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝ ╚════╝ ╚══════╝
	starting point of the application. It loads everything and it begins serving user requests.
	https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction#Helloworld_Express
*/





//
// ─── 1- DEPENDENCIES ───────────────────────────────────────────────────────────────
//

require("dotenv/config"); // NOTE: Require dotenv package first then other dependencies.
const _                = require("lodash");
const path             = require("path");
const i18n             = require("i18n");
const csrf             = require("csurf");
const flash            = require('connect-flash');
const chalk            = require("chalk");
const logger           = require("morgan");
const express          = require('express');
const favicon          = require('serve-favicon');
const session          = require('express-session');
const mongoose         = require("mongoose");
const passport         = require("passport");
const MongoStore       = require('connect-mongo')(session);
const bodyParser       = require("body-parser");
const permission       = require("permission");
const compression      = require("compression");
const errorHandler     = require('errorhandler');
const cookieParser     = require("cookie-parser");
const loggerToMongo    = require('mongo-morgan-ext');
const utilityHelpers   = require('./helpers/utility');
const expressValidator = require("express-validator");





//
// ─── 2- CONFIGURATIONS ─────────────────────────────────────────────────────────────
// NOTE: Make sure that all configuration must be replaced in config folder.

require('./config/passportConfig');
require('./config/i18nConfig');





//
// ─── 3- APPLICATION INSTANCE ───────────────────────────────────────────────────────
//

const app = express();





//
// ─── 4- DATABASE CONNECTION ────────────────────────────────────────────────────────
// This ODM and database combination is extremely popular in the Node community,
// partially because the document storage and query system looks very much like JSON,
// and is hence familiar to JavaScript developers.
// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose#Using_Mongoose_and_MongoDb_for_the_LocalLibrary
//

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
mongoose.connection.once("open", () => {
	console.log(chalk.blue.bold("conencted to the database"));
}).on("error", (error) => {
	console.error(error);
	console.log(`${chalk.red('✗')} MongoDB connection error. Please make sure MongoDB is running.`);
	process.exit();
});





//
// ─── 5- MIDDLEWARE FUNCTIONS ───────────────────────────────────────────────────────
// Express is a routing and middleware web framework that has minimal functionality of
// its own: An Express application is essentially a series of middleware function calls.
// http://expressjs.com/en/guide/using-middleware.html
//

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views/'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public/build/')));
app.use(favicon(path.join(__dirname, 'public/build/images', 'favicon.ico')));
app.use(compression())
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: false, // Don't create session until something stored.
	resave: false,            // Don't save session if unmodified.
	store: new MongoStore({
		url: process.env.MONGODB_URI,
		ttl: 60 * 60 * 1,   // One hour and remove session from database.
		resave: false,
		autoReconnect: true,
		autoRemove: 'native',
		autoRemoveInterval: 1
	})
}));
app.use(passport.initialize()); // NOTE: Passport.js middleware came after session's middleware.
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
app.use(csrf({ cookie: true }));  // csrf protection MUST be defined after cookieParser and session middleware.
app.use(loggerToMongo(process.env.MONGODB_URI, 'logs', function (req, res) {return res.statusCode > 399;}));
app.use((req, res, next) => {     // pass the Globals to all responses.
	res.locals._          = _;
	res.locals.h          = utilityHelpers;
	res.locals.urlSegment = utilityHelpers.urlSegment(req);
	res.locals.user       = req.user || null;
	res.locals.lang       = req.cookies.lang || req.setLocale('en') || 'en';
	res.locals.flashes    = req.flash() || null;
	res.locals.siteName   = process.env.SITE_NAME
	res.locals.csrfToken  = req.csrfToken();
	next();
});
app.use((req, res, next) => {
	// After successful login, redirect back to the intended page.
	if (!req.user && req.path !== '/auth/login' && req.path !== '/auth/register' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
		req.session.returnTo = req.originalUrl;
	} else if (req.user && (req.path === '/auth/profile' || req.path.match(/^\/api/))) {
		req.session.returnTo = req.originalUrl;
	}
	next();
});





//
// ─── 5- ROUTES ─────────────────────────────────────────────────────────────────────
// A route is a section of Express code that associates an HTTP verb (GET, POST, PUT, DELETE, etc.),
// an URL path/pattern, and a function that is called to handle that pattern.
// http://expressjs.com/en/guide/routing.html
//

const userRoute  = require("./routes/authRoute");
const indexRoute = require("./routes/indexRoute");
app.use("/", indexRoute);
app.use("/auth", userRoute);





//
// ─── 6- ERROR HANDELING ────────────────────────────────────────────────────────────
// Error Handling refers to how Express catches and processes errors that occur both
// synchronously and asynchronously. Express comes with a default error handler so you
// don’t need to write your own to get started.
// http://expressjs.com/en/guide/error-handling.html
//

app.use(function (req, res, next) {
	// catch 404 and forward to error handler
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
if (process.env.NODE_ENV === 'development') {
	app.use(errorHandler());
}





//
// ─── 7- SERVER LISTENER ────────────────────────────────────────────────────────────
//

app.listen(app.get('port'), () => {
	console.log(`${chalk.green('✓')} App is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`);
	console.log('  Press CTRL-C to stop\n');
});





//
// ─── 8- EXPORTING APP INSTANCE ─────────────────────────────────────────────────────
//

module.exports = app;