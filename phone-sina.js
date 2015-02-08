phantom.casperPath = "E:/GitHub/registry-machine/dependecy/casperjs";
phantom.injectJs("E:/GitHub/registry-machine/dependecy/casperjs/bin/bootstrap.js");
var casper = require("casper").create({
    pageSettings: {
        //navigationRequested: true,
        //请求资源等待时间
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
var x = require('casper').selectXPath;
var utils = require('utils');
var fs = require('fs');
var system = require('system');
var format = require('utils').format;

//a bug for phantomjs exit
//see @link(http://stackoverflow.com/questions/19144632/phantomjs-crashes-after-phantom-exit-on-linux)
casper.exit = function exit(status) {
    "use strict";
    this.emit('exit', status);
    setTimeout(function () {
        phantom.exit(status);
    }, 0);
};
var isCompleted = false;
casper.on('resource.received', function (resource) {
    if (/sso\/login.php/g.test(resource.url) && !isCompleted) {
        isCompleted = true;
        exitWithSuccess("邮箱注册成功");
    }
    //if(resource.url.indexOf('image') === -1) {
    //    casper.log('request catch:' + resource.url, 'debug');
    //}
});

var config = new Object();
if (system.args.length !== 6) {
    exitWithError('脚本参数个数不对');
} else if (!/\.js$/.test(system.args[0])) {
    exitWithError('phone-sina.js必须在其他自定义参数之前');
}
//configurable
config.uid = system.args[1];
config.pwd = system.args[2];
config.pid = system.args[3];
config.email = system.args[4];
config.password = system.args[5];
config.token = '';
config.phone = '';
config.phoneVerifyCode = '';
config.AIMA_LOGIN_URL = '';
config.AIMA_GET_PHONE_URL = '';
config.AIMA_GET_CODE_URL = '';
config.result = '';


//
//if (!config.pwd) {
//    exitWithError('The --pwd option is mandatory.');
//}
//
//if (!config.pid) {
//    exitWithError('The --pid option is mandatory.');
//}
//
//if (!config.email) {
//    exitWithError('The --email option is mandatory.');
//}
//
//if (!config.password) {
//    exitWithError('The --password option is mandatory.');
//}


config.AIMA_LOGIN_URL = format('http://api.f02.cn/http.do?action=loginIn&uid=%s&pwd=%s', config.uid, config.pwd);
config.AIMA_GET_PHONE_URL = format('http://api.f02.cn/http.do?action=getMobilenum&pid=%s&uid=%s&mobile=&size=1&token=', config.pid, config.uid);
config.AIMA_GET_CODE_URL = 'http://api.f02.cn/http.do?action=getVcodeAndReleaseMobile&uid=%s&token=%s&mobile=%s';

casper.start('https://mail.sina.com.cn/register/regmail.php', function home() {
    casper.page.onAlert = function (msg) {
        exitWithError('注册失败:' + msg)
    };
});

var checkLoadCompleted = false;
casper.then(function checkLoad() {
    this.waitUntilVisible('#emailName', function checkLoadVisible() {
        //检验邮箱名称规范
        this.log('检测邮箱格式', 'debug');
        this.sendKeys('#emailName', config.email).then(function checkEmailFormat() {
            var error = this.getHTML(x('//*[@id="form_2"]/ul/li[1]/p'));
            if (typeof error !== "undefined" && error !== "") {
                exitWithError('邮箱账号不符合规范:' + error)
            } else {
                checkLoadCompleted = true;
            }
        }, function checkLoadTimeout() {
            this.log('检测邮箱格式超时', 'debug');
        }, 2000);
    });
});

var checkEmailUsedCompleted = false;
//服务端验证邮箱名称是否已经被使用
casper.then(function checkEmailUsed() {
    if (checkLoadCompleted) {
        this.log('服务端检测邮箱是否被使用过', 'debug');
        this.waitForResource('https://mail.sina.com.cn/register/chkmail.php', function waitServerCheckEmail() {
            this.log('服务端检测邮箱是否被使用过', 'debug');
            this.sendKeys('#password_2', config.password);
            var error = this.getHTML(x('//*[@id="form_2"]/ul/li[1]/p'));
            if (typeof error !== "undefined" && error !== "") {
                exitWithError('邮箱账号出错:' + error);
            } else {
                checkEmailUsedCompleted = true;
            }
        }, function waitServerCheckEmailTimeout() {
            this.log('等待服务端检测邮箱是否被使用过，超时', 'debug');
            checkEmailUsedCompleted = true;
        }, 3000);
    }
});

//login AIMA
var loginCompleted = false;
var loginResult;
casper.then(function login() {
    if (checkEmailUsedCompleted) {
        this.log('登录爱玛平台', 'debug');
        loginResult = this.evaluate(loginAIMA, {AIMA_LOGIN_URL: config.AIMA_LOGIN_URL});
        if (loginResult == null) {
            exitWithError('登录爱玛网络出错');
        } else {
            loginCompleted = true;
        }
    }
});

var checkLoginCompleted = false;
casper.then(function checkLogin() {
    if (loginCompleted) {
        this.log('检测Token,是否登录爱玛平台', 'debug');
        var length = loginResult.split('|').length;
        if (length === 2) {
            config.token = loginResult.split("|")[1];
            this.log('成功登录爱玛平台，Response:' + loginResult, 'debug');
            this.log('成功登录爱玛平台，Token:' + config.token, 'debug');
            checkLoginCompleted = true;
        } else {
            exitWithError('爱玛返回错误Token:' + loginResult);
        }
    }
});

//get phone number
var getPhoneResult;
var getPhoneResultCompleted = false;
casper.then(function getPhoneNumber() {
    if (checkLoginCompleted) {
        this.log('从爱玛平台获取手机号码', 'debug');
        config.AIMA_GET_PHONE_URL = config.AIMA_GET_PHONE_URL + config.token;
        getPhoneResult = this.evaluate(getPhoneNum, {AIMA_GET_PHONE_URL: config.AIMA_GET_PHONE_URL});
        if (getPhoneResult == null) {
            exitWithError('请求爱玛返回手机号码，网络出错');
        } else {
            getPhoneResultCompleted = true;
        }
    }
});

var checkPhoneNumberCompleted = false;
casper.then(function checkPhoneNumber() {
    if (getPhoneResultCompleted) {
        var phoneLength = getPhoneResult.split('|').length;
        this.log('检测爱玛平台获取的手机号码：' + getPhoneResult, 'debug');
        if (phoneLength === 2) {
            config.phone = getPhoneResult.split("|")[0];
        } else {
            exitWithError('请求爱玛返回手机号码，无法识别返回数据:' + getPhoneResult);
        }
        if (!/^\d{11}$/g.test(config.phone)) {
            exitWithError("手机号码不正确:" + config.phone);
        } else {
            checkPhoneNumberCompleted = true;
        }
        this.sendKeys('#phoneNum_2', config.phone);
        this.click("#getCode_2");
    }
});

//获取手机验证码
casper.then(function checkPhoneCodeRelease() {
    if (checkPhoneNumberCompleted) {
        this.waitForResource('https://mail.sina.com.cn/cgi-bin/phonecode.php', function () {
            this.log('释放手机验证码', 'debug');
            config.AIMA_GET_CODE_URL = format(config.AIMA_GET_CODE_URL, config.uid, config.token, config.phone);
        }, function () {
            exitWithError("向新浪索取验证码超时");
        }, 3000);
    }
});

//返回手机验证码
casper.repeat(20, function waitAIMAPhoneCode() {
    casper.log("向爱玛平台所要手机验证码:" + config.AIMA_GET_CODE_URL, 'info');
    var verifyResult = casper.evaluate(getPhoneVerifyCode, {AIMA_GET_CODE_URL: config.AIMA_GET_CODE_URL});
    if (verifyResult == null) {
        exitWithError("向爱玛请求手机验证码结果，网络出错");
    }
    casper.log("爱玛平台返回验证码信息:" + verifyResult, 'debug');
    var length = verifyResult.split('|').length;
    if (length === 2) {
        config.phoneVerifyCode = verifyResult.split('|')[1].replace(/[^\d]/g, '');
        this.log("发现野生的手机验证码一枚:" + config.phoneVerifyCode, 'info');
        if (!utils.isNumber(parseInt(config.phoneVerifyCode))) {
            exitWithError("爱玛返回验证码的不对");
        }
        //write phone verify code
        this.sendKeys('#checkCode_2', config.phoneVerifyCode);
        //click submit button
        this.click("#openNow_2");
        //等待登录界面
        this.then(function () {
            casper.waitForResource(/sso\/login.php/g, function () {
                //exitWithSuccess("邮箱注册成功");
            }, function timeout() {
                // step to execute if check has failed
                this.wait(3000, function () {
                    casper.captureSelector(getTime() + '-timeout.png', "html");
                });
            }, 3000).then(function () {
                //这里加then,防止repeat继续运行
                exitWithError("提交注册信息超时");
            });
        });
    } else {
        this.log("AIMA response wrong code,need try:" + verifyResult, 'error');
        casper.wait(3000);
    }
});

//utils.dump(casper.steps.map(function (step) {
//    return step.toString();
//}));

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

function exitWithError(message) {
    config.result = {
        code: 1,
        msg: message
    };
    utils.dump(config);
    //this.wait(3000, function () {
    //    casper.captureSelector(getTime() + '-error.png', "html");
    //}).then(function() {
    //    casper.exit();
    //});
    casper.exit(1);
}

function exitWithSuccess(message) {
    config.result = {
        code: 0,
        msg: message
    };
    utils.dump(config);
    casper.exit();
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



