global.appRoot = require("app-root-path");

const TAG = "[ServerState] ";

const logger = require(appRoot + "/lib/winston");

const run = async () => {
	//mongoDB
	global.mongoDB = await require(appRoot + "/dbconn/mongoConnection")();
	logger.info(TAG + "---- MongoDB Connected ----");

	//webserver
	const webServer = await require(appRoot + "/webServer");
	webServer.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
		if (err) {
			logger.error(err);
			process.exit(1);
		} else {
			logger.info(TAG + "---- Web Server is Ready ----");
		}
	});
};

run();
