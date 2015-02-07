phantom.casperPath = "E:/GitHub/registry-machine/dependecy/casperjs";
phantom.injectJs("E:/GitHub/registry-machine/dependecy/casperjs/bin/bootstrap.js");
var casper = require("casper").create({
    pageSettings: {
        //navigationRequested: true,
        //请求资源等待时间
        webSecurityEnabled: false,
        resourceTimeout: 6000,
        //loadPlugins: false,
        userAgent: "Mozilla/5.0 (Linux;U;Android 2.2.2;zh-cn;ZTE-C_N880S Build/FRF91) AppleWebkit/531.1(KHTML, like Gecko) Version/4.0 Mobile Safari/531.1"
    },
    viewportSize: {
        width: 1024,
        height: 768
    },
    verbose: true,
    logLevel: 'debug'
});
phantom.outputEncoding = "gbk";
var x = require('casper').selectXPath;
var utils = require('utils');
var fs = require('fs');
var format = require('utils').format;

casper.on('resource.received', function (resource) {
    if(resource.url.indexOf('image') === -1) {
        casper.log('request catch:' + resource.url, 'debug');
    }
});

//configurable
var uid = '2509003147';
var pwd = '1314520';
var pid = '1219';
var email = 'wsscy2004caa';
var password = '2692194';
var token;
var phone;
var phoneVerifyCode = '123123';

var AIMA_LOGIN_URL = format('http://api.f02.cn/http.do?action=loginIn&uid=%s&pwd=%s', uid, pwd);
var AIMA_GET_PHONE_URL = format('http://api.f02.cn/http.do?action=getMobilenum&pid=%s&uid=%s&mobile=&size=1&token=', pid, uid);
var AIMA_GET_CODE_URL = 'http://api.f02.cn/http.do?action=getVcodeAndReleaseMobile&uid=%s&token=%s&mobile=%s';


casper.start('https://mail.sina.com.cn/register/regmail.php', function () {
    casper.page.onAlert = function (msg) {
        throw new CasperError('注册失败：' + msg);
    };
    this.sendKeys('#emailName', email);
    try {
        var error = this.getHTML(x('//*[@id="form_2"]/ul/li[1]/p'));
        if (!error == null) {
            this.log('邮箱账号不符合规范：' + error);
            this.exit();
        }
    } catch (e) {
        this.log("邮箱名称符合规定", 'info');
    }
    //服务端验证邮箱名称是否已经被使用
    this.waitForResource('https://mail.sina.com.cn/register/chkmail.php', function () {
        try {
            var error = this.getHTML(x('//*[@id="form_2"]/ul/li[1]/p'));
            if (!error == null) {
                this.log('邮箱账号出错：' + error);
                this.exit();
            }
        } catch (e) {
            this.log("邮箱名称没有被人注册", 'info');
        }
    }, function () {
        this.log('Wait check email name time out', 'info');
    }, 2000);
    this.sendKeys('#password_2', password);


    //login and get token
    var loginResult = this.evaluate(loginAIMA, {AIMA_LOGIN_URL: AIMA_LOGIN_URL});
    if (loginResult == null) {
        casper.exit(101);
    }
    var length = loginResult.split('|').length;
    if (length === 2) {
        token = loginResult.split("|")[1];
        this.log("AIMA Server response:" + token, 'info');
    } else {
        throw new CasperError("AIMA Server response wrong:" + loginResult);
    }


    //get phone number
    var getPhoneResult = this.evaluate(getPhoneNum, {AIMA_GET_PHONE_URL: AIMA_GET_PHONE_URL + token});
    if (getPhoneResult == null) {
        casper.exit(101);
    }
    var phoneLength = getPhoneResult.split('|').length;
    this.log("Server response phone num:" + getPhoneResult, 'info');
    if (phoneLength === 2) {
        phone = getPhoneResult.split("|")[0];
    }
    if (!/^\d{11}$/g.test(phone)) {
        throw new CasperError("phone is wrong:" + phone);
    }
    this.sendKeys('#phoneNum_2', phone);


    //获取手机验证码
    this.click("#getCode_2");
    this.waitForResource('https://mail.sina.com.cn/cgi-bin/phonecode.php', function () {
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
                //write phone verify code
                this.sendKeys('#checkCode_2', phoneVerifyCode);
                //click submit button
                this.click("#openNow_2");
                this.log("Submit registry!!!!!!!!!!!!!!!!!!!!!!!!!!!", 'info');
                //等待登录界面
                casper.waitForResource(/sso\/login.php/g, function () {
                    this.log(format("账号：%s,密码:%s" ,email,password), 'info');
                    this.captureSelector(getTime() + '-done.png', "html");
                },function timeout() {
                // step to execute if check has failed
                    this.wait(3000, function () {
                        casper.captureSelector(getTime() + '-timeout.png', "html");
                    });
                }, 3000).then(function(){casper.exit();});
            } else {
                this.log("AIMA response wrong code,need try:" + verifyResult, 'error');
                casper.wait(3000);
            }
        })
    }, function () {
        throw new CasperError("Relase phone code time ou");
    }, 3000);
});
casper.run(function () {
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



