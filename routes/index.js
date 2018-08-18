const express         = require("express");
const router          = express.Router();
const indexController = require('../controllers/index');

router.get("/", indexController.getHome);
router.get("/lang/:lang", indexController.setLang);
router.get('/resturants', indexController.getListOfData);
router.get('/resturants/page/:page', indexController.getListOfData);

module.exports = router;