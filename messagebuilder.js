const header = "^(Hi, I'm a bot for linking direct images of albums with only 1 image)";
var footer = "\n\n^[Source](https://github.com/AUTplayed/imguralbumbot) ";
footer += "^| ^[Why?](https://github.com/AUTplayed/imguralbumbot/blob/master/README.md) ";
footer += "^| ^[Creator](https://np.reddit.com/user/AUTplayed/) ";
footer += "^| ^[ignore me](https://np.reddit.com/message/compose/?to=imguralbumbot&subject=ignoreme&message=ignoreme) ";



module.exports = build;

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
