const i18n = require("i18n");
const path = require("path");
i18n.configure({
	locales: ['en', 'ar'],
	cookie: 'lang',
	directory: path.join(path.dirname(__dirname), '/languages'),
	register: global,
	objectNotation: true,
});