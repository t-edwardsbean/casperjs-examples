var casper = require("casper").create({
    pageSettings: {
        //navigationRequested: true,
        //请求资源等待时间
        resourceTimeout: 1000,
        //loadPlugins: false,
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"
    },
    viewportSize: {
        width: 1024,
        height: 768
    },
    verbose: true,
    logLevel: 'info'
});
var utils = require('utils');
var uu = 'http://';
var AIMA_LOGIN_URL = 'http://api.f02.cn/http.do?action=loginIn&uid=2509003147&pwd=1314520';
var AIMA = 'http://';

function loginAIMA(AIMA_LOGIN_URL) {
    try {
        return __utils__.sendAJAX(AIMA_LOGIN_URL, 'POST', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}

casper.start("http://passport.sohu.com/web/dispatchAction.action?appid=1113&ru=http://mail.sohu.com/reg/signup_success.jsp", function() {
    //Login first
    var response = this.evaluate(loginAIMA, {AIMA_LOGIN_URL: AIMA_LOGIN_URL});
    this.log("Server response:" + response, 'info');

    //this.waitForSelector("#yzm_img", (function() {
    //    this.captureSelector(new Date().getTime() + '.png', "#yzm_img");
    //    this.echo("Saved screenshot of " + (this.getCurrentUrl()));
    //}), (function() {
    //    this.die("Timeout reached. Fail whale?");
    //    this.exit();
    //}), 12000);
});
casper.run();


function getPhoneNum() {
    return casper.evaluate(function(wsurl) {
        return JSON.parse(__utils__.sendAJAX(wsurl, 'GET', null, false));
    }, {wsurl: wsurl});
}

function getPictureVerifyCode() {
    return casper.evaluate(function(wsurl) {
        return JSON.parse(__utils__.sendAJAX(wsurl, 'GET', null, false));
    }, {wsurl: wsurl});
}

function getPhoneVerifyCode() {
    return casper.evaluate(function(wsurl) {
        return JSON.parse(__utils__.sendAJAX(wsurl, 'GET', null, false));
    }, {wsurl: wsurl});
}

