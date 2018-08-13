const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
mongoose.Promise = global.Promise;


const UserSchema = mongoose.Schema({
	email: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true,
		validate: [validator.isEmail, 'Invalid Email Address'],
		required: 'Please Supply an Email Address'
	},
	password: {
		type: String,
		required: true
	},
	profile: {
		name: {
			type: String,
			required: 'Please Supply a Name',
			trim: true
		},
		username: {
			type: String,
			required: 'please supply a username',
			trim: true
		},
		gender: String,
		location: String,
		website: String,
		picture: String
	},
	resturants: [{
		type: mongoose.Schema.ObjectId,
		ref: 'Resturant'
	}]
});


UserSchema.pre("save", function(next) {
	const user = this;
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(10, function(err, salt) {
		if(err) return next(err);
		bcrypt.hash(user.password, salt, function (err, hash) {
			if(err) return next(err);
			user.password = hash;
			next();
		})
	})
});
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch)=> {
		if(err) return cb(err);
		cb(null, isMatch);
	})
}
UserSchema.methods.gravatar = function gravatar(size) {
	if (!size) {size = 200;}
	if (!this.email) {
		return `https://gravatar.com/avatar/?s=${size}&d=retro`;
	}
	const md5 = crypto.createHash('md5').update(this.email).digest('hex');
	return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};


module.exports = mongoose.model("User", UserSchema);