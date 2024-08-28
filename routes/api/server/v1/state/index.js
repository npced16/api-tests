require("dotenv").config();
const { MONGO_URI } = process.env;
const { MongoClient } = require("mongodb");
const dayjs = require("dayjs");

const TAG = "[server/routes/api/serverState/index.js] ";
const logger = require(appRoot + "/lib/winston");

module.exports = async (fastify, options) => {
	fastify.get("/", async (request, reply) => {
		const { serverName } = request.query;

		if (!serverName || serverName.length === 0) {
			return reply.send(
				new Error("serverName is a mandatory option and must be provided")
			);
		}
		const resData = {
			responseTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
			message: "",
			data: {
				serverName: serverName,
				wardList: [],
			},
		};

		try {
			const docs = await mongoDB
				.collection("ward")
				.find({ serverName: serverName })
				.toArray();

			const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");

			for (let doc of docs) {
				const updatedAt = dayjs(doc.updateAt, "YYYY-MM-DD HH:mm:ss");
				if (dayjs().diff(updatedAt, "hour") >= 1) {
					let updatedItems = {};

					Object.keys(doc.items).forEach((itemKey) => {
						const item = doc.items[itemKey];
						const minRunning = Math.floor(item.total * 0.8);
						const maxRunning = Math.floor(item.total * 0.95);
						item.running = Math.floor(
							Math.random() * (maxRunning - minRunning + 1) + minRunning
						);
						updatedItems[`items.${itemKey}.running`] = item.running;
					});

					await mongoDB.collection("ward").updateOne(
						{ _id: doc._id },
						{
							$set: {
								...updatedItems,
								updateAt: currentTime,
							},
						}
					);
					doc.updateAt = currentTime;
				}
				resData.data.wardList.push({
					wardName: doc.wardName,
					data: doc.items,
					updateAt: doc.updateAt,
				});
			}

			if (resData.data.wardList.length > 0) {
				logger.info(TAG + "API request completed");
				return reply.send(resData);
			} else {
				logger.warn(TAG + "API request failed (no data)");
				resData.message = "no data";
				return reply.send(resData);
			}
		} catch (err) {
			logger.error(TAG + err);
			resData.message = err;
			return reply.send(resData);
		}
	});

	fastify.get("/serverList", async (request, reply) => {
		const resData = {
			responsemessage: "success",
			responsedate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
			data: {
				serverList: [],
			},
		};

		try {
			const wards = await mongoDB.collection("ward").find().toArray();
			const currentTime = dayjs();

			const serverStats = {};

			for (let ward of wards) {
				const updatedAt = dayjs(ward.updateAt, "YYYY-MM-DD HH:mm:ss");
				let shouldUpdate = false;

				if (currentTime.diff(updatedAt, "hour") >= 1) {
					let updatedItems = {};

					Object.keys(ward.items).forEach((itemKey) => {
						const item = ward.items[itemKey];
						const minRunning = Math.floor(item.total * 0.8);
						const maxRunning = Math.floor(item.total * 0.95);
						item.running = Math.floor(
							Math.random() * (maxRunning - minRunning + 1) + minRunning
						);
						updatedItems[`items.${itemKey}.running`] = item.running;
					});

					await mongoDB.collection("ward").updateOne(
						{ _id: ward._id },
						{
							$set: {
								...updatedItems,
								updateAt: currentTime.format("YYYY-MM-DD HH:mm:ss"),
							},
						}
					);

					shouldUpdate = true;
				}

				if (!serverStats[ward.serverName]) {
					serverStats[ward.serverName] = {
						serverName: ward.serverName,
						serverState: "running",
						data: {},
					};
				}

				Object.keys(ward.items).forEach((itemKey) => {
					if (!serverStats[ward.serverName].data[itemKey]) {
						serverStats[ward.serverName].data[itemKey] = {
							total: 0,
							running: 0,
						};
					}
					serverStats[ward.serverName].data[itemKey].total +=
						ward.items[itemKey].total;
					serverStats[ward.serverName].data[itemKey].running +=
						ward.items[itemKey].running;
				});
			}

			resData.data.serverList = Object.values(serverStats);

			if (resData.data.serverList.length > 0) {
				logger.info(TAG + "API request completed");
				return reply.send(resData);
			} else {
				logger.warn(TAG + "API request failed (no data)");
				resData.responsemessage = "no data";
				return reply.send(resData);
			}
		} catch (err) {
			logger.error(TAG + err);
			resData.responsemessage = "error";
			resData.message = err.message;
			return reply.send(resData);
		}
	});
};
