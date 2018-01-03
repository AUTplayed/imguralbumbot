var fork = require("child_process").fork;
var pr = fork("./index.js");
setInterval(() => {
	pr.kill();
	pr = fork("./index.js");
}, 1000 * 60 * 60 * 12);