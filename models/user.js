/*
     ██╗   ██╗███████╗███████╗██████╗ ███████╗ ██████╗██╗  ██╗███████╗███╗   ███╗ █████╗
    ██║   ██║██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝██║  ██║██╔════╝████╗ ████║██╔══██╗
   ██║   ██║███████╗█████╗  ██████╔╝███████╗██║     ███████║█████╗  ██╔████╔██║███████║
  ██║   ██║╚════██║██╔══╝  ██╔══██╗╚════██║██║     ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══██║
 ╚██████╔╝███████║███████╗██║  ██║███████║╚██████╗██║  ██║███████╗██║ ╚═╝ ██║██║  ██║
 ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝
*/




//
// ─── 1- DEPENDENCIES ────────────────────────────────────────────────────────────
//

const slug             = require('mongoose-slug-updater');
const crypto           = require('crypto');
const bcrypt           = require("bcryptjs");
const mongoose         = require("mongoose");
const validator        = require("validator");
const mongoosePaginate = require("mongoose-paginate");
      mongoose.Promise = global.Promise;





//
// ─── 2- DEFINING SCHEMA ─────────────────────────────────────────────────────────
//

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
	slug: {
		type: String,
		slug: "profile.name"
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
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	role: {
		type: String,
		default: "user"
	}
});






//
// ─── 3- SCHEMA HOOKS ────────────────────────────────────────────────────────────
//

UserSchema.pre("save", function (next) {
	const user = this;
	// skip it stop this function from running
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(Number(process.env.PASSWORD_HASH_ROUNDS), function (err, salt) {
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





//
// ─── 4- SCHEMA METHODS ──────────────────────────────────────────────────────────
//

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
		if (err) return cb(err);
		cb(null, isMatch);
	})
};

UserSchema.methods.gravatar = function gravatar(size, user) {
	if (!size) { size = 200; } 			// default size.
	if (!user) { user = this.email; } 	// default email is this schema email.
	const md5 = crypto.createHash('md5').update(user).digest('hex');
	return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};





//
// ─── 5- SCHEMA PLUGINS ──────────────────────────────────────────────────────────
//

UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(slug);





//
// ─── 6- SCHEMA MODEL ────────────────────────────────────────────────────────────
//

const User = mongoose.model("User", UserSchema);





//
// ─── 7- EXPORTING SCHEMA ────────────────────────────────────────────────────────
//

module.exports = User;