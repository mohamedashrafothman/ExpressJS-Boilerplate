const express         = require("express");
const router          = express.Router();
const indexController = require('../controllers/index');
const passportConfig = require('../config/passport');
const permission = require("permission");

router.get("/", indexController.getHome);
router.get("/lang/:lang", indexController.setLang);
router.get('/users', permission(["admin"]), passportConfig.isAuthenticated, indexController.getListOfUsers);
router.get('/users/page/:page', permission(["admin"]), passportConfig.isAuthenticated, indexController.getListOfUsers);

module.exports = router;