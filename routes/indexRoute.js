/*
	     ██╗███╗   ██╗██████╗ ███████╗██╗  ██╗██████╗  ██████╗ ██╗   ██╗████████╗███████╗        ██╗███████╗
	    ██║████╗  ██║██╔══██╗██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝        ██║██╔════╝
	   ██║██╔██╗ ██║██║  ██║█████╗   ╚███╔╝ ██████╔╝██║   ██║██║   ██║   ██║   █████╗          ██║███████╗
	  ██║██║╚██╗██║██║  ██║██╔══╝   ██╔██╗ ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝     ██   ██║╚════██║
	 ██║██║ ╚████║██████╔╝███████╗██╔╝ ██╗██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██╗╚█████╔╝███████║
	╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝ ╚════╝ ╚══════╝
	Defining and using separate route modules:
	http: //expressjs.com/en/starter/basic-routing.html
*/



//
// ─── 1- DEPENDENCIES ───────────────────────────────────────────────────────────────
//

const router          = require("express").Router();
const permission      = require("permission");
const passportConfig  = require('../config/passportConfig');
const indexController = require('../controllers/indexController');





//
// ─── 2- ROUTES BREAKPOINTS ─────────────────────────────────────────────────────────
//

router.get("/", indexController.getHome);
router.get("/lang/:lang", indexController.setLang);
router.get('/users', passportConfig.isAuthenticated, permission(["superAdmin", "admin"]), indexController.getListOfUsers);
router.get('/users/page/:page', passportConfig.isAuthenticated, permission(["superAdmin", "admin"]), indexController.getListOfUsers);
router.get('/admins', passportConfig.isAuthenticated, permission(["superAdmin"]), indexController.getListOfAdmins);
router.get('/admins/page/:page', passportConfig.isAuthenticated, permission(["superAdmin"]), indexController.getListOfAdmins);





//
// ─── 3- EXPORTING ROUTER ───────────────────────────────────────────────────────────
//

module.exports = router;