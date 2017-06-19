const header = "^(Hi, I'm a bot for linking direct images of albums with only 1 image)";
var footer = "\n\n^^[Source](https://github.com/AUTplayed/imguralbumbot) ";
footer += "^^| ^^[Why?](https://github.com/AUTplayed/imguralbumbot/blob/master/README.md) ";
footer += "^^| ^^[Creator](https://np.reddit.com/user/AUTplayed/) ";
footer += "^^| ^^[state_of_imgur](https://np.reddit.com/user/imguralbumbot/comments/6i1huv/imgur_has_gone_to_shit/) ";
footer += "^^| ^^[ignoreme](https://np.reddit.com/message/compose/?to=imguralbumbot&subject=ignoreme&message=ignoreme) ";



module.exports.build = build;
module.exports.autoreply = autoreply;

function build(poc){
    var msg = {};
    msg.text = header;
    msg.location = poc.id;
    poc.direct.forEach(function(d){
        msg.text+="\n\n"+d.imgurdirect;
    });
    msg.text += footer;
    return msg;
}

function autoreply(reply){
    var msg = "^"+reply+"";
    msg+=footer;
    return msg;
}
