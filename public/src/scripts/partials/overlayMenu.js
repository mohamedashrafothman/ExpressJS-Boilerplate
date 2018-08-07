module.exports = () => {
	//todo - When user click off sidebar, close side bar.
	
	
	/** 
	 ** Caching Dom
	 */
	var dir                    = $("html").attr("dir");
	var $openIcon              = $(".menu-open");
	var $menu                  = $(".overlay");
	var $closeIcon             = $menu.find(".menu-close");
	var menuEnterenceDirection = $menu.attr("data-enternce-direction") || "left";
	var menuExitDirection      = $menu.attr("data-exit-direction") || "left";
	var menuSpeed              = $menu.attr("data-speed") || " ";
	var animationType          = $menu.attr("data-animation-type") || "slide";
	var enternceAnimation      = `${lowerize(animationType)}In${(dir === "ltr") ? capitalize(menuEnterenceDirection) : capitalize(menuExitDirection)} ${menuSpeed}`;
	var exitAnimation          = `${lowerize(animationType)}Out${(dir === "ltr") ? capitalize(menuExitDirection) : capitalize(menuEnterenceDirection)} ${menuSpeed}`;


	/**
	 ** Helper Functions
	 */
	function capitalize(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	function lowerize(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}


	/** 
	 ** Events
	*/
	$openIcon.on("click", function () {
		openMenu();
	});
	$closeIcon.on("click", function () {
		closeMenu();
	});


	/**
	 ** main functions
	*/
	function openMenu() {
		if (!$menu.hasClass("open")) {
			$menu.addClass("open").animateCss(enternceAnimation, function () {
				$menu.removeClass(`${enternceAnimation} animated`);
			});
		}
	}
	function closeMenu() {
		if ($menu.hasClass("open")) {
			$menu.animateCss(exitAnimation, function () {
				$menu.removeClass(`${exitAnimation} open animated`);
			});
		}
	}
};