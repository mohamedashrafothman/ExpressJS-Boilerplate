const express        = require("express");
const router         = express.Router();
const passport       = require("passport");
const userController = require("../controllers/user");
const passportConfig = require('../config/passport');
const _              = require('lodash');
const multer         = require('multer');
const AvatarStorage  = require('../helpers/AvatarStorage');

// setup a new instance of the AvatarStorage engine 
var storage = AvatarStorage({
	square: true,
	responsive: true,
	greyscale: false,
	quality: 90
});
var limits = {
	files: 1, // allow only 1 file per request
	fileSize: 1024 * 1024 * 5, // 5 MB (max file size)
};
var fileFilter = function (req, file, cb) {
	// supported image file mimetypes
	var allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif'];
	console.log(file);
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
	storage: storage,
	limits: limits,
	fileFilter: fileFilter
});


router.get("/login", userController.getLogin);
router.get("/register", userController.getRegisteration);
router.post("/register", userController.validateRegister, userController.registerUser);
router.post("/login", userController.validateLogin, userController.loginUser);
router.get('/logout', passportConfig.isAuthenticated, userController.logoutUser);
router.get('/profile', passportConfig.isAuthenticated, userController.getUserProfile);
router.post('/profile/avatar', passportConfig.isAuthenticated, upload.single(process.env.AVATAR_FIELD), userController.updateUserAvatar)
router.post('/profile/update', passportConfig.isAuthenticated, userController.validateUserProfile, userController.updateUserProfile);
router.post('/profile/password', passportConfig.isAuthenticated, userController.validateUserPassword, userController.updateUserPassword);
router.get('/profile/delete', passportConfig.isAuthenticated, userController.deleteUserAccount);
router.get("/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink)
router.get('/forgot', userController.getForgot);
router.post('/forgot', userController.postForgot);
router.get('/reset/:token', userController.getResetPassword);
router.post('/reset/:token', userController.validateResetPassword, userController.postResetPassword);
router.get('/verify/:email/:hash', userController.verifyUser);

// Google Auth
router.get('/google', passport.authenticate("google", {scope: 'profile email'}));
router.get('/google/redirect', passport.authenticate("google") ,userController.oauthRedirect)
router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
router.get('/facebook/redirect', passport.authenticate('facebook', { failureRedirect: '/user/login' }), userController.oauthRedirect);
router.get('/github', passport.authenticate('github'));
router.get('/github/redirect', passport.authenticate('github', { failureRedirect: '/user/login' }), userController.oauthRedirect);



module.exports = router;