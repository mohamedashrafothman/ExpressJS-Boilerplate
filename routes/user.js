const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const passportConfig = require('../config/passport');

router.get("/login", userController.getLogin);
router.get("/register", userController.getRegisteration);
router.post("/register", userController.validateRegister, userController.registerUser);
router.post("/login", userController.validateLogin, userController.loginUser);
router.get('/logout', passportConfig.isAuthenticated, userController.logoutUser);

module.exports = router;