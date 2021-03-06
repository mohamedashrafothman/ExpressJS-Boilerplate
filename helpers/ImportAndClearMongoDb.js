/*
     ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗      ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗    ██████╗  █████╗ ████████╗ █████╗
    ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝      ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
   ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   █████╗█████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║       ██║  ██║███████║   ██║   ███████║
  ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════╝██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║       ██║  ██║██╔══██║   ██║   ██╔══██║
 ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║         ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║       ██████╔╝██║  ██║   ██║   ██║  ██║
╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝         ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
*/


require('dotenv').config({path: __dirname + '/../.env'});
const fs               = require('fs');
const to               = require("await-to-js").default;
const User             = require('../models/User');
const chalk            = require("chalk");
const mongoose         = require('mongoose');
      mongoose.Promise = global.Promise;


class ImportAndClearMongoDb {
	constructor(users){
		this.users = users;
		this.connectMongo();
		this.readJsonFiles(__dirname + '/../data/users.json');
		if (process.argv.includes('--delete')) {
			this.deleteData();
		} else {
			this.loadData();
		}
	}

	connectMongo(){
		mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
		mongoose.connection.once("open", () => {
			console.log(chalk.blue.bold("\n\nconencted to the database\n"));
		}).on("error", (error) => {
			console.error(error);
			console.log(`${chalk.red.bold('✗')} MongoDB connection error. Please make sure MongoDB is running.`);
			process.exit();
		});
	}

	readJsonFiles(path) {
		this.users = JSON.parse(fs.readFileSync(path, 'utf-8'));
	}

	async deleteData() {
		const [removeUsersError, removedUser] = await to(User.remove());
		if(removeUsersError) {
			console.log(removeUsersError);
			process.exit();
		}
		console.log(chalk.blue("Goodbye Data...\n"));
		console.log(chalk.blue(`Data Deleted. To load sample data, run\n\n${chalk.green("npm run sample")}\n\n`));
		process.exit();
	}
	async loadData() {
		const [saveUsersError, savedUsers] = await to(User.insertMany(this.users));
		if(saveUsersError){
			console.log(chalk.red(`Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t ${chalk.blue("npm run blowitallaway")}\n\n\n`));
			console.log(saveUsersError);
			process.exit();
		}
		console.log(chalk.blue('Done!'));
		process.exit();
	}
};

module.exports = new ImportAndClearMongoDb;
