const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const to = require("await-to-js").default;

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
	host: "smtp.mailtrap.io",
	port: 2525,
	secure: false, // true for 465, false for other ports
	auth: {
		user: "263bef18b9356d", // generated ethereal user
		pass: "240cb4687c6bda" // generated ethereal password
	},
	tls: {
		rejectUnautherized: false
	}
});

const generateHTML = (filename, options = {}) => {
	const html = pug.renderFile(`${__dirname}/../views/emails/${filename}.pug`, options);
	const inline = juice(html);
	return inline;
};

const send = (options) => {
	const html = generateHTML(options.filename, options);
	const text = htmlToText.fromString(html);
	const mailOptions = {
		from: `Mohamed Ashraf <mido.ma201096@gmail.com>`,
		to: options.user.email,
		subject: options.subject,
		html: html,
		text: text
	};
	return transporter.sendMail(mailOptions);
};


module.exports = {
	send
};