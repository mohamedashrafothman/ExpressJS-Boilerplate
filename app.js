/**
 ** Requiring Dependencies
 */
const express    = require('express');
const path       = require("path");
const logger     = require("morgan");
const port       = process.env.PORT || 4000;
const indexRoute = require("./routes/index");
const app        = express();



/** 
 ** Middlewares
 */
// view engine setup
app.set('views', path.join(__dirname, 'views/'));
app.set('view engine', 'pug');
// serves up static files from the public folder. Anything in public/build/ will just be served up as the file it is
app.use(express.static(path.join(__dirname, 'public/build/')));
app.use(logger("dev"));


app.use((req, res, next)=> {
	app.locals.title = 'Express Starter Env.';
	next();
})

/**
 ** Routing
 */
app.use("/", indexRoute);


app.listen(port, function () {
	console.log('app is running');
});