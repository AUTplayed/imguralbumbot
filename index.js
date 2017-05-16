var Snoo = require("snoocore");
require("dotenv").config();
var env = process.env;

var reddit = new Snoo({
    userAgent: env.useragent,
    oauth:{
        type:'script',
        key: env.redditclientkey,
        secret: env.redditsecret,
        username: env.reddituser,
        password: env.redditpw,
        scope: ['identity','read']
    }
});



reddit('/api/v1/me').get().then(function(result) {
  console.log(result); 
});