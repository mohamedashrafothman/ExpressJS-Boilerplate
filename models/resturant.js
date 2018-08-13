const mongoose = require("mongoose");

const ResturantSchema = mongoose.Schema({
	address: {
		bilding: String,
		coord: [Number],
		street: String,
		zipcode: String
	},
	borough: String,
	cuisine: String,
	grades: [{
		date: Date,
		grade: String,
		score: Number
	}],
	name: String,
	restaurant_id: String
});


const Resturant = mongoose.model("Resturant", ResturantSchema);
module.exports = Resturant;