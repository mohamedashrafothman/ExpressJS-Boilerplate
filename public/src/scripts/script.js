const animateCssInit = require("./partials/animateCssInit");
const overlayMenu = require("./partials/overlayMenu");
const tooltipInit = require("./partials/tooltipInit");


$(window).on("load", () => {
	$(".preloader").animate({
		opacity: 0
	}, 500, function () {
		$(this).removeClass("d-flex").addClass("d-none");
		$("body").removeClass("preloader-site");
	});
});
$(document).ready(() => {
	$("body").addClass("preloader-site");
	animateCssInit();
	overlayMenu();
	tooltipInit();
});
