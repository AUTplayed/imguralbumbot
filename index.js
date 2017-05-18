var Snoo = require("snoowrap");
require("dotenv").config();
var imgur = require('./imgur.js');
var fs = require("fs");

var dfooter = "^| ^[deletthis](http://np.reddit.com/message/compose/?to=imguralbumbot&subject=delet%20this&message=delet%20this%20";
var ends = ") ";
var env = process.env;
var clog = [], plog = [], ignore = [];
if (fs.existsSync("ignore"))
    ignore = [].concat(fs.readFileSync("ignore", "utf-8").split("\n"));
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
    if (plog.indexOf(post.id) == -1 && ignore.indexOf(post.author) == -1) {
        //console.log("bs post");
        var msg = msgbuilder(post);
        var failed = false;
        reddit.getSubmission(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT") && !err.message.startsWith("Forbidden")) {
                console.log(err);
            }
        }).then((repl) => {
            if (!failed) {
                plog.push(msg.location);
                fs.appendFile("plog", msg.location + "\n", function () { });
                repl.edit(repl.body + dfooter + repl.id + ends);
            }
        });
    } else {
        console.log("duplicate post");
    }
});

imgur.on('comment', function (comment) {
    if (clog.indexOf(comment.id) == -1 && ignore.indexOf(comment.author) == -1) {
        //console.log("bs comment");
        var msg = msgbuilder(comment);
        var failed = false;
        reddit.getComment(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT")) {
                console.log(err);
            }
        }).then((repl) => {
            if (!failed) {
                clog.push(msg.location);
                fs.appendFile("clog", msg.location + "\n", function () { });
                repl.edit(repl.body + dfooter + repl.id + ends);
            }
        });
    } else {
        console.log("duplicate comment");
    }
});

setInterval(function () {
    reddit.getUnreadMessages().then((list) => {
        list.forEach(function (item) {
            if (item.body.startsWith("ignoreme")) {
                fs.appendFile("ignore", item.author, function () { });
                ignore.push(item.author);
                item.markAsRead();
            } else if (item.body.startsWith("delet this ")) {
                item.markAsRead();
                reddit.getComment(item.body.split("delet this ")[1]).fetch().then((todelete) => {
                    if (todelete.link_author == item.author) {
                        todelete.delete();
                    } else {
                        if (todelete.parent_id.startsWith("t1_")) {
                            reddit.getComment(item.parent_id.substring(3, item.parent_id.length)).fetch().then((co) => {
                                if (co.author == item.author) {
                                    todelete.delete();
                                }
                            });
                        }
                    }
                });

            }
        });
    });
}, 1000 * 60);


//console.log(reddit.getSubmission("6bhhfr"));

//reddit.getComment("dhml6ru").reply("testing2\n\n3").then(console.log).error((err)=>console.log(err));
