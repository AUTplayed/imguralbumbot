var Snoo = require("snoowrap");
require("dotenv").config();
var imgur = require('./imgur.js');

var dfooter = "^^| ^^[deletthis](https://np.reddit.com/message/compose/?to=imguralbumbot&subject=delet%20this&message=delet%20this%20";
var ends = ") ";
const punct = [".", ",", "!", "?", "(", ")", "[", "]", "\n", "/", " ", "^"];
var env = process.env;
var db = require("./db.js");

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
    if (!db.exists("p", post.id)) {
        //console.log("bs post");
        reddit.getSubreddit(post.subreddit).fetch().then((s) => {
            if (s.user_is_moderator) {
                var redditpost = reddit.getSubmission(post.id);
                redditpost.reply(msgbuilder.modremove(post));
                redditpost.remove().then(() => {
                    db.log("p", post.id);
                });
            } else {
                if (!db.isIgnored(post.author)) {
                    var msg = msgbuilder.build(post);
                    var failed = false;
                    reddit.getSubmission(msg.location).reply(msg.text).catch(function (err) {
                        failed = true;
                        if (!err.message.startsWith("RATELIMIT") && !err.message.startsWith("Forbidden")) {
                            //console.log(err);
                        }
                    }).then((repl) => {
                        if (!failed) {
                            db.log("p", msg.location);
                            repl.edit(repl.body + dfooter + repl.id + ends);
                        }
                    });
                }
            }
        });

    } else {
        console.log("duplicate post");
    }
});

imgur.on('comment', function (comment) {
    if (!db.exists("c", comment.id) && !db.isIgnored(comment.author)) {
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
                db.log("c", msg.location);
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
                if (!db.isIgnored(item.author.name)) {
                    db.ignore(item.author.name);
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
                                    if (co.author.name == item.author.name || co.author.name == "[deleted]") {
                                        todelete.delete();
                                        console.log("deleted " + co.id);
                                    }
                                });
                            }
                        }
                    });
                });
            } else {
                if (item.author && item.author.name != "AutoModerator" && item.author.name != "reddit" && !db.isIgnored(item.author.name)) {
                    require("./autoreply.js").some(function (filters) {
                        return filters.key.some(function (filter) {
                            //Check if a keyword is in a comment, but has eighter a space, punctuation mark or nothing in front and behind
                            var index = item.body.toLowerCase().indexOf(filter);
                            if (index != -1 &&
                                ((index === 0 || punct.indexOf(item.body[index - 1]) > -1) &&
                                    (index + filter.length == item.body.length || punct.indexOf(item.body[index + filter.length]) > -1))) {

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

