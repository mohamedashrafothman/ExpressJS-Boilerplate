/**
 * Swiper 4.3.5
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * http://www.idangero.us/swiper/
 *
 * Copyright 2014-2018 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: July 31, 2018
 */
var Swiper = require("swiper");
module.exports = function () {
	/**
	 * ? new Swiper(swiperContainer, parameters) - initialize swiper with options
	 * ? swiperContainer: HTMLElement or string(with CSS Selector) of swiper container HTML element.Required.
	 * ? parameters: object - object with Swiper parameters.Optional.
	 */
	var mySwiper = new Swiper(".swiper-container", {
		init: true,
		direction: "horizontal",
		speed: 1000,
		loop: true,
		parallax: true,
		grabCursor: true,
		keyboard: {
			enabled: true,
			onlyInViewport: true
		},
		effect: "fade",
		fadeEffect: {
			crossFade: true
		},
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev"
		}
	});

	mySwiper.init();
};