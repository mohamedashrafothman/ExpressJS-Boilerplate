const express        = require("express");
const router         = express.Router();
const passport       = require("passport");
const userController = require("../controllers/user");
const passportConfig = require('../config/passport');

router.get("/login", userController.getLogin);
router.get("/register", userController.getRegisteration);
router.post("/register", userController.validateRegister, userController.registerUser);
router.post("/login", userController.validateLogin, userController.loginUser);
router.get('/logout', passportConfig.isAuthenticated, userController.logoutUser);
router.get('/profile', passportConfig.isAuthenticated, userController.getUserProfile);
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