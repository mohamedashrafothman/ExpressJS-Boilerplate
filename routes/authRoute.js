/*
	      █████╗ ██╗   ██╗████████╗██╗  ██╗██████╗  ██████╗ ██╗   ██╗████████╗███████╗        ██╗███████╗
	    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝        ██║██╔════╝
	   ███████║██║   ██║   ██║   ███████║██████╔╝██║   ██║██║   ██║   ██║   █████╗          ██║███████╗
	  ██╔══██║██║   ██║   ██║   ██╔══██║██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝     ██   ██║╚════██║
	 ██║  ██║╚██████╔╝   ██║   ██║  ██║██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██╗╚█████╔╝███████║
	╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝ ╚════╝ ╚══════╝
	Defining and using separate route modules:
	http: //expressjs.com/en/starter/basic-routing.html
*/



//
// ─── 1- DEPENDENCIES ───────────────────────────────────────────────────────────────
//

const _              = require('lodash');
const multer         = require('multer');
const express        = require("express");
const router         = express.Router();
const passport       = require("passport");
const permission     = require("permission");
const AvatarStorage  = require('../helpers/AvatarStorage');
const userController = require("../controllers/authController");
const passportConfig = require('../config/passportConfig');




//
// ─── 2- FILE STORAGE ──────────────────────────────────────────────────────────────
// setup a new instance of the AvatarStorage engine

var storage = AvatarStorage({
	square    : true,
	responsive: true,
	greyscale : false,
	quality   : 90
});
var limits = {
	files   : 1,                 // allow only 1 file per request
	fileSize: 1024 * 1024 * 5,   // 5 MB (max file size)
};
var fileFilter = function (req, file, cb) {
	// supported image file mimetypes
	var allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif'];
	if (_.includes(allowedMimes, file.mimetype)) {
		// allow supported image files
		cb(null, true);
	} else {
		// throw error for invalid files
		cb(new Error('Invalid file type. Only jpg, png and gif image files are allowed.'));
	}
};
// setup multer
var upload = multer({
	storage   : storage,
	limits    : limits,
	fileFilter: fileFilter
});





//
// ─── 3- ROUTES BREAKPOINTS ─────────────────────────────────────────────────────────
//

router.get("/login", userController.getLogin);
router.get("/register", userController.getRegisteration);
router.post("/register", userController.validateRegister, userController.registerUser);
router.post("/login", userController.validateLogin, userController.loginUser);
router.get('/logout', passportConfig.isAuthenticated, userController.logoutUser);
router.get('/profile/:name', passportConfig.isAuthenticated, permission(["user", "admin", "superAdmin"]), userController.getUserProfile);
router.post('/profile/:id/upateAvatar', passportConfig.isAuthenticated, permission(["user", "admin", "superAdmin"]), upload.single(process.env.AVATAR_FIELD), userController.updateUserAvatar)
router.post('/profile/:id/updateInfo', passportConfig.isAuthenticated, userController.validateUserProfile, userController.updateUserProfile);
router.post('/profile/:id/updatePassword', passportConfig.isAuthenticated, userController.validateUserPassword, userController.updateUserPassword);
router.get('/profile/:id/delete', passportConfig.isAuthenticated, userController.deleteUserAccount);
router.get("/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink)
router.get('/forgot', userController.getForgot);
router.post('/forgot', userController.postForgot);
router.get('/reset/:token', userController.getResetPassword);
router.post('/reset/:token', userController.validateResetPassword, userController.postResetPassword);
router.get('/verify/:email/:hash', userController.verifyUser);





//
// ─── 4- OAUTH BREAKPOINTS ──────────────────────────────────────────────────────────
// 4.1- Google
// 4.2- FaceBook
// 4.3- Github

// 4.1
router.get('/google', passport.authenticate("google", {scope: 'profile email'}));
router.get('/google/redirect', passport.authenticate("google"), userController.oauthRedirect);
// 4.2
router.get('/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));
router.get('/facebook/redirect', passport.authenticate('facebook', {failureRedirect: '/auth/login'}), userController.oauthRedirect);
// 4.3
router.get('/github', passport.authenticate('github'));
router.get('/github/redirect', passport.authenticate('github', {failureRedirect: '/auth/login'}), userController.oauthRedirect);





//
// ─── 5- EXPORTING ROUTER ───────────────────────────────────────────────────────────
//
module.exports = router;