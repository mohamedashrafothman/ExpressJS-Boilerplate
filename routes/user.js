const express        = require("express");
const router         = express.Router();
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
router.get('/forgot', userController.getForgot);
router.post('/forgot', userController.postForgot);
router.get('/reset/:token', userController.getResetPassword);
router.post('/reset/:token', userController.validateResetPassword, userController.postResetPassword);
router.get('/verify/:email/:hash', userController.verifyUser);

module.exports = router;