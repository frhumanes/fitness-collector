var config = module.exports = {};

config.db = {};
config.db.database = process.env.DB_DATABASE|| "miveri";
config.db.host = process.env.DB_HOST || "localhost";
config.db.user = process.env.DB_USER || "miveri";
config.db.password = process.env.DB_PASSWORD || "miveri";

config.fitbit = {};
config.fitbit.clientID = "FITBIT_ID";
config.fitbit.clientSecret = "FITBIT_SECRET";
