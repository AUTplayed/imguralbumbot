var RedditStream = require('reddit-stream');
const EventEmitter = require('events');
var fs = require("fs");

var pstream = new RedditStream('posts','all');
var cstream = new RedditStream('comments','all');
//var pcount = 0,ccount = 0;
const emitter = new EventEmitter();

module.exports = emitter;

pstream.start();
pstream.on('new',function(posts){
    /*pcount+=posts.length;
    console.log(pcount);*/
    posts.forEach(function(post){
        if(post.data.url && post.data.url.includes("://imgur.com/a/"))
        {
            emitter.emit('post',post.data);
        }
    });
});
pstream.on('error',function(err){
    emitter.emit('error',err);
}); 

cstream.start();
cstream.on('new',function(comments){
    /*ccount+=comments.length;
    console.log(ccount);*/
    fs.writeFileSync("example3.json",JSON.stringify(comments[0].data));
    comments.forEach(function(comment){
        if(comment.data.body_html.includes("://imgur.com/a/")){
            emitter.emit('comment',comment.data);
        }
    });
});
cstream.on('error',function(err){
    emitter.emit('error',err);
}); 