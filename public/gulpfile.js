"use strict";

var gulp        = require("gulp");
// var pug         = require("gulp-pug");
var sass        = require("gulp-sass");
var cssmin      = require("gulp-cssmin");
var rtlcss      = require("gulp-rtlcss");
var rename      = require("gulp-rename");
var prefix      = require("gulp-autoprefixer");
var uglify      = require("gulp-uglify");
var concat      = require("gulp-concat");
var browserify  = require("browserify");
var imagemin    = require("gulp-imagemin");
var buffer      = require("vinyl-buffer");
var source      = require("vinyl-source-stream");
var sourcemaps  = require("gulp-sourcemaps");
var eslint      = require("gulp-eslint");
var size        = require("gulp-size");
var browserSync = require("browser-sync").create();


// /*
//  * HTML Tasks
//  */
// gulp.task("pug", function () {
// 	return gulp.src("src/views/**/*.pug")
// 		.pipe(pug({
// 			pretty: true
// 		}))
// 		.pipe(gulp.dest("build"))
// 		.pipe(browserSync.stream());
// });


/*
 * CSS tasks.
 */
gulp.task("sass", function () {
	return gulp.src("src/sass/style.scss")
		.pipe(sourcemaps.init())
		.pipe(sass.sync().on("error", sass.logError))
		.pipe(prefix("last 2 versions"))
		.pipe(sourcemaps.write())
		.pipe(cssmin())
		.pipe(concat("styles.css"))
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(gulp.dest("build/styles"))
		.pipe(size({
			pretty: true,
			showFiles: true
		}))
		.pipe(browserSync.stream());
});
gulp.task("rtl", function () {
	return gulp.src(["build/styles/styles.min.css"])
		.pipe(sourcemaps.init())
		.pipe(prefix("last 2 versions"))
		.pipe(gulp.dest("build/styles"))
		.pipe(rtlcss())
		.pipe(rename({
			suffix: "-rtl"
		}))
		.pipe(gulp.dest("build/styles"))
		.pipe(size({
			pretty: true,
			showFiles: true
		}))
		.pipe(browserSync.stream());
});

/*
 * JS Tasks
 */
gulp.task("js", function () {
	return browserify({
			entries: "src/scripts/script.js",
			debug: true
		})
		.transform("babelify", {
			presets: ["es2015"]
		})
		.bundle()
		.pipe(source("app.js"))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(concat("app.js"))
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(gulp.dest("build/scripts"))
		.pipe(size({
			pretty: true,
			showFiles: true
		}))
		.pipe(browserSync.stream());
});
gulp.task("lint", function () {
	return gulp.src(["src/scripts/**/*.js"])
		.pipe(eslint())
		.pipe(eslint.format());
});

/*
 * Fonts Tasks
 */
gulp.task("fonts", function () {
	return gulp.src("src/fonts/**/*.+(eot|svg|ttf|woff|woff2)")
		.pipe(gulp.dest("build/fonts"))
		.pipe(browserSync.stream());
});

/*
 * Images Tasks 
 */
gulp.task("images", function () {
	return gulp.src("src/images/**/*.+(png|jpg|gif|svg|ico)")
		.pipe(imagemin({
			optimizationLevel: 5
		}))
		.pipe(gulp.dest("build/images"))
		.pipe(size({
			pretty: true,
			showFiles: true
		}))
		.pipe(browserSync.stream());
});

// "pug",
gulp.task("default", ["sass", "rtl", "lint", "js", "fonts", "images"], function () {
	browserSync.init({
		server: "./build",
		open: false
	});
	// gulp.watch("src/views/**/*.pug", ["pug"]);
	// gulp.watch("src/views/*.pug", ["pug"]);
	gulp.watch("src/sass/**/*.scss", ["sass"]);
	gulp.watch("src/sass/*.scss", ["sass"]);
	gulp.watch("build/styles/styles.min.css", ["rtl"]);
	gulp.watch("src/scripts/**/*.js", ["lint"]);
	gulp.watch("src/scripts/*.js", ["lint"]);
	gulp.watch("src/scripts/**/*.js", ["js"]);
	gulp.watch("src/scripts/*.js", ["js"]);
	gulp.watch("src/fonts/**/*.+(eot|svg|ttf|woff|woff2)", ["fonts"]);
	gulp.watch("src/images/**/*.+(png|jpg|gif|svg|ico)", ["images"]);
	gulp.watch("./build/*.html").on("change", browserSync.reload);
});