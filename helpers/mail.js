const pug        = require('pug');
const juice      = require('juice');
const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.MAIL_USER, // generated ethereal user
		pass: process.env.MAIL_PASS // generated ethereal password
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