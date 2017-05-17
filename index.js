var Snoo = require("snoowrap");
require("dotenv").config();
var imgur = require('./imgur.js');
var fs = require("fs");

var env = process.env;
var clog = [], plog = [];

if (fs.existsSync("clog"))
    clog = [].concat(fs.readFileSync("clog", "utf-8").split("\n"));
if (fs.existsSync("plog"))
    plog = [].concat(fs.readFileSync("plog", "utf-8").split("\n"));

var reddit = new Snoo({
    userAgent: env.useragent,
    clientId: env.redditclientkey,
    clientSecret: env.redditsecret,
    username: env.reddituser,
    password: env.redditpw
});


imgur.on('error', function (err) {
    console.log(err);
});

var msgbuilder = require('./messagebuilder.js');
imgur.on('post', function (post) {
    if (plog.indexOf(post.id) == -1) {
        //console.log("bs post");
        var msg = msgbuilder(post);
        var failed = false;
        reddit.getSubmission(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT")&&!err.message.startsWith("Forbidden")) {
                console.log(err);
            }
        }).then(() => {
            if (!failed) {
                plog.push(msg.location);
                fs.appendFile("plog", msg.location + "\n", function () { });
            }
        });
    } else {
        console.log("duplicate post");
    }
});

imgur.on('comment', function (comment) {
    if (clog.indexOf(comment.id) == -1) {
        //console.log("bs comment");
        var msg = msgbuilder(comment);
        var failed = false;
        reddit.getComment(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT")) {
                console.log(err);
            }
        }).then(() => {
            if (!failed) {
                clog.push(msg.location);
                fs.appendFile("clog", msg.location + "\n", function () { });
            }
        });
    } else {
        console.log("duplicate comment");
    }
});


//console.log(reddit.getSubmission("6bhhfr"));

//reddit.getComment("dhml6ru").reply("testing2\n\n3").then(console.log).error((err)=>console.log(err));
