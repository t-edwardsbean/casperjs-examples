var casper = require("casper").create({
	viewportSize: {
		width: 1024,
		height: 768
	}
});

casper.start("http://passport.sohu.com/web/dispatchAction.action?appid=1113&ru=http://mail.sohu.com/reg/signup_success.jsp", function() {
	this.waitForSelector("#yzm_img", (function() {
		this.captureSelector('out1.png', "#yzm_img");
		this.echo("Saved screenshot of " + (this.getCurrentUrl()) + " to " + filename);
	}), (function() {
		this.die("Timeout reached. Fail whale?");
		this.exit();
	}), 12000);
});

casper.run();