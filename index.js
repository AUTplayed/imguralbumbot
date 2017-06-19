var Snoo = require("snoowrap");
require("dotenv").config();
var imgur = require('./imgur.js');
var fs = require("fs");

var dfooter = "^| ^[deletthis](https://np.reddit.com/message/compose/?to=imguralbumbot&subject=delet%20this&message=delet%20this%20";
var ends = ") ";
const punct = [".", ",", "!", "?", "(", ")", "[", "]"];
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
        var msg = msgbuilder.build(post);
        var failed = false;
        reddit.getSubmission(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT") && !err.message.startsWith("Forbidden")) {
                //console.log(err);
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
        var msg = msgbuilder.build(comment);
        var failed = false;
        reddit.getComment(msg.location).reply(msg.text).catch(function (err) {
            failed = true;
            if (!err.message.startsWith("RATELIMIT")) {
                //console.log(err);
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
            if (item.body.startsWith("ignoreme") && item.author != undefined) {
                if (ignore.indexOf(item.author.name) == -1) {
                    fs.appendFile("ignore", item.author.name + "\n", function () { });
                    ignore.push(item.author.name);
                }
                item.markAsRead();
            } else if (item.body.startsWith("delet this ")) {
                item.markAsRead();
                reddit.getComment(item.body.split(" ")[2]).fetch().then((todelete) => {
                    reddit.getSubmission(todelete.link_id.substring(3, todelete.link_id.length)).fetch().then((parentlink) => {
                        if (parentlink.author.name == item.author.name) {
                            todelete.delete();
                            console.log("deleted " + item.author.name);
                        } else {
                            if (todelete.parent_id.startsWith("t1_")) {
                                reddit.getComment(todelete.parent_id.substring(3, todelete.parent_id.length)).fetch().then((co) => {
                                    if (co.author.name == item.author.name) {
                                        todelete.delete();
                                        console.log("deleted " + co.id);
                                    }
                                });
                            }
                        }
                    });
                });
            } else {
                if (item.author && item.author.name != "AutoModerator" && item.author.name != "reddit" && ignore.indexOf(item.author.name) == -1) {
                    require("./autoreply.js").some(function (filters) {
                        return filters.key.some(function (filter) {
                            //Check if a keyword is in a comment, but has eighter a space, punctuation mark or nothing in front and behind
                            var index = item.body.toLowerCase().indexOf(filter);
                            if (index != -1 &&
                                ((index === 0 || item.body[index - 1] == ' ' || punct.indexOf(item.body[index - 1]) > -1) &&
                                    (index + filter.length == item.body.length || item.body[index + filter.length] == ' ' || punct.indexOf(item.body[index + filter.length]) > -1))) {

                                var msg = filters.reply[Math.floor(Math.random() * filters.reply.length)];
                                msg = msgbuilder.autoreply(msg);
                                item.reply(msg);
                                reddit.markMessagesAsRead([item]);
                                return true;
                            }
                        });
                    });
                } else {
                    if (item.body.indexOf("gold") == -1) {
                        reddit.markMessagesAsRead([item]);
                    }
                }
            }
        });
    });
}, 1000 * 60);

