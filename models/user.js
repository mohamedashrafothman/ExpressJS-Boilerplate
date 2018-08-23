const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const validator = require("validator");
mongoose.Promise = global.Promise;


const UserSchema = mongoose.Schema({
	email: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true,
		validate: [validator.isEmail, 'Invalid Email Address']
	},
	password: {
		type: String
	},
	hash: {
		type: String
	},
	active: {
		type: Number,
		default: 0
	},
	profile: {
		name: {
			type: String,
			trim: true
		},
		username: {
			type: String,
			trim: true
		},
		gender: String,
		location: String,
		website: String,
		picture: String,
		picture_sm: String,
		picture_md: String,
		picture_lg: String
	},
	google: String,
	facebook: String,
	github: String,
	tokens: Array,
	resturants: [{
		type: mongoose.Schema.ObjectId,
		ref: 'Resturant'
	}],
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

UserSchema.pre("save", function (next) {
	const user = this;
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(12, function (err, salt) {
		if (err) return next(err);
		bcrypt.hash(user.password, salt, async function (err, hash) {
			if (err) return next(err);
			const RandomBytes = await crypto.randomBytes(16).toString('hex');
			user.password = hash;
			user.hash = RandomBytes;
			next();
		})
	})
});
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
		if (err) return cb(err);
		cb(null, isMatch);
	})
}
UserSchema.methods.gravatar = function gravatar(size) {
	if (!size) {
		size = 200;
	}
	if (!this.email) {
		return `https://gravatar.com/avatar/?s=${size}&d=retro`;
	}
	const md5 = crypto.createHash('md5').update(this.email).digest('hex');
	return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

module.exports = mongoose.model("User", UserSchema);