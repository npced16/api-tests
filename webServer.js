const fastify = require("fastify")({ logger: true });
const path = require("path");

fastify.register(require("@fastify/cors"), {
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(require("@fastify/autoload"), {
	dir: path.join(__dirname, "/routes"),
});

module.exports = fastify;
