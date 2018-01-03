module.exports.exists = exists;
module.exports.log = log;
module.exports.ignore = ignore;
module.exports.isIgnored = isIgnored;
module.exports.load = load;
module.exports.set = set;
module.exports.get = get;

require("dotenv").config();

var redis = require("redis").createClient(process.env.REDIS_URL);
var mongo = require("mongodb").MongoClient;
const mongourl = process.env.MONGODB_URL;

var ignorelist = [];
var loglist = [];

function exists(type, id) {
	return ~loglist.indexOf(type + id);
}

function log(type, id) {
	loglist.push(type + id);
	redis.setex(type + id, 60 * 5, "y");
}

function isIgnored(name) {
	return ~ignorelist.indexOf(name);
}

function ignore(name, cb) {
	ignorelist.push(name);
	mongodb((db, close) => {
		db.collection("ignore").insertOne({ name: name }, (err) => { if (err) { console.log(err); } close(); cb(); });
	});
}

function set(type, count) {
	mongodb((db, close) => {
		db.collection("stats").update({ _id: type }, { count: count }, { upsert: true }, (err) => { if (err) { console.log(err); } close(); });
	});
}

function get(type, callback) {
	mongodb((db, close) => {
		db.collection("stats").findOne({ _id: type }, (err, count) => {
			close();
			callback(count.count);
		});
	});
}

function load(done) {
	mongodb((db, close) => {
		db.collection("ignore").find({}).toArray().then((arr) => {
			ignorelist = mapTo(arr, "name");
			close();
			redis.keys("*", (err, l) => {
				if (err) console.log(err);
				loglist = l;
				done();
			});
		});
	});
}

function mapTo(arr, attr) {
	var array = [];
	arr.forEach((e) => {
		array.push(e[attr]);
	});
	return array;
}

function mongodb(callback) {
	mongo.connect(mongourl, (err, client) => {
		if (err) console.log(err);
		var db = client.db("heroku_jsd0048l");
		callback(db, () => {
			client.close();
		});
	});
}