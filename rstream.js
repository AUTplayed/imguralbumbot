var RedditStream = require('reddit-stream');
const EventEmitter = require('events');
var db = require("./db.js");

var pstream = new RedditStream('posts', 'all');
var cstream = new RedditStream('comments', 'all');
//var pcount = 0,ccount = 0;
const emitter = new EventEmitter();

module.exports = emitter;

db.load(() => {
    pstream.start();
    cstream.start();
});

pstream.on('new', function (posts) {
    /*pcount+=posts.length;
    console.log(pcount);*/
    posts.forEach(function (post) {
        if (post.data.url && post.data.url.includes("://imgur.com/a/")) {
            emitter.emit('post', post.data);
        }
    });
});
pstream.on('error', function (err) {
    emitter.emit('error', err);
});

cstream.on('new', function (comments) {
    /*ccount+=comments.length;
    console.log(ccount);*/
    comments.forEach(function (comment) {
        if (comment.data.body_html.includes("://imgur.com/a/")) {
            emitter.emit('comment', comment.data);
        }
    });
});
cstream.on('error', function (err) {
    emitter.emit('error', err);
}); 