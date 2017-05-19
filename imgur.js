var rstream = require('./rstream.js');
var request = require('request');
var fs = require("fs");
require("dotenv").config();
const EventEmitter = require('events');

const regex = /href=".*imgur.com.*"/g;
const baseurl = "https://api.imgur.com/3/album/";
const apikey = process.env.imgurkey;
const emitter = new EventEmitter();
var viablecount = 0,bscount = 0;
module.exports = emitter;

if(fs.existsSync("viablecount"))
    viablecount = parseInt(fs.readFileSync("viablecount","utf-8"));
if(fs.existsSync("bscount"))
    bscount = parseInt(fs.readFileSync("bscount","utf-8"));

rstream.on('post', function (post) {
    //console.log("post", post.title);
    var arr = [];
    arr.push({ url: post.url });
    checkAlbum(arr, function (directs) {
        if (parse(post, directs)) {
            emitter.emit('post', post);
        }
    });
});

rstream.on('comment', function (comment) {
    //console.log("comment", comment.body);
    var urls = comment.body_html.match(regex);
    if (urls) {
        for (var i = 0; i < urls.length; i++) {
            urls[i] = urls[i].split('"')[1];
            urls[i] = { url: urls[i] };
        }
        checkAlbum(urls, function (directs) {
            if (parse(comment, directs)) {
                emitter.emit('comment', comment);
            }
        });
    }
});

function parse(poc, directs) {
    if (directs.length !== 0) {
        poc.direct = directs;
        //console.log("single img album");
        bscount++;
        if(bscount%50===0){
            fs.writeFile("viablecount",viablecount,function(){console.log("logged viable");});
            fs.writeFile("bscount",bscount,function(){console.log("logged bs");});
        }
        return true;
    } else {
        //console.log("viable album");
        viablecount++;
        return false;
    }
}

rstream.on('error', function (err) {
    emitter.emit('error', err);
});

function checkAlbum(urls, callback) {
    //console.log(urls);
    checkSingleRec(urls, 0, callback);
}

function checkSingleRec(urls, index, callback) {
    if (index >= urls.length) {
        callback(urls.filter(function (e) {
            return e.imgurdirect !== undefined;
        }));
    } else {
        callapi(urls[index].url, function (body) {
            if (body.data.images_count == 1) {
                urls[index].imgurdirect = body.data.images[0].link.replace(".gif", ".gifv");
            }
            checkSingleRec(urls, index + 1, callback);
        });
    }
}

function callapi(url, callback) {
    var requrl = baseurl + url.split("/a/")[1];
    request(requrl, {
        headers: {
            "authorization": "Client-ID " + apikey
        }
    }, function (err, res, body) {
        try {
            body = JSON.parse(body);
        } catch (err) {
            //fs.writeFileSync("error"+Date.now()+".html");
            console.log("imgur request err:", body);
            return;
        }
        callback(body);
    });
}