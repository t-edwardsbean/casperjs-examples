phantom.casperPath = "E:/GitHub/registry-machine/dependecy/casperjs";
phantom.injectJs("E:/GitHub/registry-machine/dependecy/casperjs/bin/bootstrap.js");
var casper = require("casper").create({
    pageSettings: {
        //navigationRequested: true,
        //请求资源等待时间
        webSecurityEnabled: false,
        resourceTimeout: 2000,
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
casper.on('resource.received', function (resource) {
    casper.log('request catch:' + resource.url, 'debug');
});

var x = require('casper').selectXPath;
var fs = require('fs');
phantom.outputEncoding = "gbk";
var utils = require('utils');


//configurable
var uid = '2509003147';
var pwd = '1314520';
var pid = '1219';
var password = '2692194';


var AIMA_LOGIN_URL = format('http://api.f02.cn/http.do?action=loginIn&uid=%s&pwd=%s', uid, pwd);
var AIMA_GET_PHONE_URL = format('http://api.f02.cn/http.do?action=getMobilenum&pid=%s&uid=%s&mobile=&size=1&token=', pid, uid);
var AIMA_GET_CODE_URL = 'http://api.f02.cn/http.do?action=getVcodeAndReleaseMobile&uid=%s&token=%s&mobile=%s';
var SINA_REG = 'https://mail.sina.com.cn/register/regmail.php';


var token;
var phone;
var phoneVerifyCode;

casper.start(SINA_REG, function () {
    //login and get token
    var loginResult = this.evaluate(loginAIMA, {AIMA_LOGIN_URL: AIMA_LOGIN_URL});
    if(loginResult == null) {
        casper.exit(101);
    }
    token = loginResult.split("|")[1];
    this.log("Server response:" + token, 'info');
    //get phone number
    var getPhoneResult;

    getPhoneResult = this.evaluate(getPhoneNum, {AIMA_GET_PHONE_URL: AIMA_GET_PHONE_URL + token});

    phone = getPhoneResult.split("|")[0];
    this.log("Server response phone num:" + phone, 'info');
    if (!/^\d{11}$/g.test(phone)) {
        throw new CasperError("phone is wrong:" + phone);
    }
    //click to phone registry
    this.click("div.loginTag li:nth-child(2) a");
    //write phone num , as account of email
    this.sendKeys('form[name=frm_reg_tel] input[name=email]', phone);
    //write password
    this.sendKeys('form[name=frm_reg_tel] input[name=psw]', password);
    this.log('send key ok:' + getTime());
});
casper.waitUntilVisible("div.freeTelCode", function () {
    //click get phone verfy code
    this.thenClick("div.freeTelCode")
});

casper.waitForResource(/phonecode\.php$/, function () {
    try {
        var error = this.getHTML('form[name=frm_reg_tel] div.tipError abbr');
        this.log('Release phone code error:' + error);
    } catch(e) {
        casper.wait(2000, function () {
            casper.captureSelector(getTime() + 'code-release.png', "html");
        });
        casper.log('click release code ok:' + casper.getHTML('div.freeTelCode'), 'info');
        AIMA_GET_CODE_URL = format(AIMA_GET_CODE_URL, uid, token, phone);
        casper.repeat(20, function () {
            //返回手机验证码
            casper.log("Request for code url:" + AIMA_GET_CODE_URL, 'info');
            var verifyResult = casper.evaluate(getPhoneVerifyCode, {AIMA_GET_CODE_URL: AIMA_GET_CODE_URL});
            casper.log("AIMA response verify code:" + verifyResult, 'info');
            var length = verifyResult.split('|').length;
            if (length === 2) {
                phoneVerifyCode = verifyResult.split('|')[1].replace(/[^\d]/g,'');
                this.log("Get verify code验证码:" + phoneVerifyCode, 'info');
                if (!utils.isNumber(parseInt(phoneVerifyCode))) {
                    throw new CasperError("验证码不对");
                }
                utils.dump(phoneVerifyCode);
                //write phone verify code
                this.sendKeys('form[name=frm_reg_tel] input[name=msgvcode]',phoneVerifyCode);
                //click submit button
                this.click("a.subIcoTel");
                this.log("Submit registry!!!!!!!!!!!!!!!!!!!!!!!!!!!", 'info');
                //等待登录界面
                casper.waitForResource(/sso\/login.php/g, function () {
                    this.log(format("账号：%s,密码:%s" ,phone,password), 'info');
                    this.captureSelector(getTime() + '-done.png', "html");
                },function timeout() { // step to execute if check has failed
                    try {
                        var error = this.getHTML('form[name=frm_reg_tel] div.tipError abbr');
                        throw new CasperError("Submit error:" + error);
                    } catch(e) {
                        fs.write('source.txt', this.evaluate(function _evaluate() {
                            return this.getHTML('html');
                        }), 'w');
                        casper.log('wait submit timeout', 'error');
                        casper.captureSelector(getTime() + '-timeout.png', "html").then(function(){casper.exit();});
                    }
                }, 3000).then(function(){casper.exit();});
            } else {
                this.log("AIMA response wrong code,need try:" + verifyResult, 'error');
                casper.wait(3000);
            }
        })
    }
}, function timeout() { // step to execute if check has failed
    casper.log('wait release code timeout', 'error');
    casper.captureSelector(getTime() + '-timeout.png', "html");
}, 3000);


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
        __utils__.log('网络错误' + e);
    }
}

function getPhoneNum(AIMA_GET_PHONE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_PHONE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        throw new CasperError('网络错误' + e);
    }
}


function getPictureVerifyCode(AIMA_GET_CODE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_CODE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        throw new CasperError('网络错误' + e);
    }
}

function getTime() {
    var time = new Date();
    return time.getMinutes() + "-" + time.getSeconds() + "-" + time.getMilliseconds();
}

function getPhoneVerifyCode(AIMA_GET_CODE_URL) {
    try {
        return __utils__.sendAJAX(AIMA_GET_CODE_URL, 'GET', null, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        throw new CasperError('网络错误' + e);
    }
}
