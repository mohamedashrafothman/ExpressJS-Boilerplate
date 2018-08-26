const express         = require("express");
const router          = express.Router();
const permission      = require("permission");
const passportConfig  = require('../config/passportConfig');
const indexController = require('../controllers/indexController');

router.get("/", indexController.getHome);
router.get("/lang/:lang", indexController.setLang);
router.get('/users', passportConfig.isAuthenticated, permission(["superAdmin", "admin"]), indexController.getListOfUsers);
router.get('/users/page/:page', passportConfig.isAuthenticated, permission(["superAdmin", "admin"]), indexController.getListOfUsers);
router.get('/admins', passportConfig.isAuthenticated, permission(["superAdmin"]), indexController.getListOfAdmins);
router.get('/admins/page/:page', passportConfig.isAuthenticated, permission(["superAdmin"]), indexController.getListOfAdmins);

module.exports = router;