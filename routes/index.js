const express         = require("express");
const router          = express.Router();
const permission      = require("permission");
const passportConfig  = require('../config/passport');
const indexController = require('../controllers/index');

router.get("/", indexController.getHome);
router.get("/lang/:lang", indexController.setLang);
router.get('/users', permission(["admin"]), passportConfig.isAuthenticated, indexController.getListOfUsers);
router.get('/users/page/:page', permission(["admin"]), passportConfig.isAuthenticated, indexController.getListOfUsers);

module.exports = router;