const header = "^(Hi, I'm a bot for linking direct images of albums with only 1 image)";
const footer = "\n\n^[Source](https://github.com/AUTplayed/imguralbumbot)";

module.exports = build;

function build(poc){
    var msg = {};
    msg.text = header;
    msg.location = poc.id;
    /*
    if(poc.is_self!==undefined){
        msg.post = true;
    }else{
        msg.comment = true;
    }*/
    poc.direct.forEach(function(d){
        msg.text+="\n\n"+d.imgurdirect;
    });
    msg.text+=footer;
    return msg;
}