/*====================================================================================================
	This is a file of data and helper functions that we can expose and use in our templating function
====================================================================================================*/
const crypto            = require("crypto");
const moment            = require('moment');
const dump              = (obj) => JSON.stringify(obj, null, 2);
const staticMap         = ([lng, lat]) => `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=800x150&key=${process.env.MAP_KEY}&markers=${lat},${lng}&scale=2`;
const createRandomToken = (byteNum)=> {return crypto.randomBytes(byteNum).toString('hex')}

module.exports = {
	moment,
	dump,
	staticMap,
	createRandomToken
};