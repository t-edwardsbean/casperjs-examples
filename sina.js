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
    logLevel: 'debug'
});
casper.on('page.resource.requested', function (requestData, request) {
    this.log("Open requested:" + requestData.url, 'info');
    utils.dump(requestData);
    utils.dump(request);
    isCompleted = true;
});

var x = require('casper').selectXPath;
//phantom.outputEncoding = "gbk";
var utils = require('utils');
var uu = 'http://';
var AIMA_LOGIN_URL = 'http://api.f02.cn/http.do?action=loginIn&uid=2509003147&pwd=1314520';
var AIMA_GET_PHONE_URL = 'http://api.f02.cn/http.do?action=getMobilenum&pid=1219&uid=2509003147&mobile=&size=1&token=';
var AIMA_GET_CODE_URL = '';
var AIMA_URL = 'http://api.f02.cn';
var SINA_REG = 'https://mail.sina.com.cn/register/regmail.php';


var token;
var phone = '18046049822';
var phoneVerifyCode = '143952';
var password = '2692194';
var isCompleted = false;


casper.start(AIMA_URL, function () {
    var loginResult = this.evaluate(loginAIMA, {AIMA_LOGIN_URL: AIMA_LOGIN_URL});
    token = loginResult.split("|")[1];
    this.log("Server response:" + token, 'info');
    //var getPhoneResult = this.evaluate(getPhoneNum, {AIMA_GET_PHONE_URL: AIMA_GET_PHONE_URL + token});
    //phone = getPhoneResult.split("|")[0];
    //this.log("Server response:" + phone, 'info');
});

casper.start(SINA_REG, function () {
    //click to phone registry
    this.click("div.loginTag li:nth-child(2) a");
    //write phone num , as account of email
    this.sendKeys('form[name=frm_reg_tel] input[name=email]', phone);
    //click get phone verfy code
    //this.click("div.freeTelCode");
    //get phone verify code
    //var verifyResult = this.evaluate(getPhoneVerifyCode, {AIMA_GET_CODE_URL: AIMA_GET_CODE_URL});
    //phoneVerifyCode = verifyResult.split('|')[0];
    //write phone verify code
    this.sendKeys('form[name=frm_reg_tel] input[name=msgvcode]', phoneVerifyCode);
    //write password
    this.sendKeys('form[name=frm_reg_tel] input[name=psw]', password);
    //click submit button
    this.click("a.subIcoTel");

    this.waitForResource(
        function() {
            return isCompleted;
        }
        , function () {
            this.captureSelector(new Date().getTime() + '.png', "html");
        }, function () {
            this.log("Wait for submit timeout", 'error');
        }, 2000);

});

casper.run(function () {
    //done exit
    casper.exit();
});


function loginAIMA(AIMA_LOGIN_URL) {
    try {
        return __utils__.sendAJAX(AIMA_LOGIN_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}

function getPhoneNum(AIMA_GET_PHONE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_PHONE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}


function getPictureVerifyCode(AIMA_GET_CODE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_CODE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}

function getPhoneVerifyCode(AIMA_GET_CODE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_CODE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}