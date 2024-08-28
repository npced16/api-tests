require("dotenv").config();
const { MONGO_URI } = process.env;

const { MongoClient, ObjectId } = require("mongodb");

const TAG = "[Server/mongoConnection.js] ";

const logger = require(appRoot + "/lib/winston");

module.exports = async () => {
	const client = new MongoClient(MONGO_URI);
	const dbName = "server";

	await client
		.connect()
		.then(() => {
			logger.info(TAG + "Mongodb [" + dbName + "] Connected Success");
		})
		.catch((err) => {
			logger.error(TAG + err);
		});

	return client.db(dbName);
};
