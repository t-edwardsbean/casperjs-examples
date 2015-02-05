//casperjs --disk-cache=yes spider.js --web-security=no
var casper = require('casper').create({
    pageSettings: {
        //navigationRequested: true,
        //请求资源等待时间
        resourceTimeout: 1000,
        loadImages: false,
        //loadPlugins: false,
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"
    },
    verbose: true,
    logLevel: 'info'
});
var utils = require('utils');
var host = "http://172.17.150.115:8080/today";
var cityIds = [
    101010100,
    101010200,
    101010300,
    101010400,
    101010500,
    101010600,
    101010700,
    101010800,
    101010900,
    101011000,
    101011100,
    101011200,
    101011300,
    101011400,
    101011500,
    101020100,
    101020200,
    101020300,
    101020500,
    101020600,
    101020700,
    101020800,
    101020900,
    101021000,
    101021100,
    101021200,
    101021300,
    101030100,
    101030200,
    101030300,
    101030400,
    101030500,
    101030600,
    101030700,
    101030800,
    101030900,
    101031000,
    101031100,
    101031200,
    101031400,
    101040100,
    101040200,
    101040300,
    101040400,
    101040500,
    101040600,
    101040700,
    101040800,
    101040900,
    101041000,
    101041100,
    101041300,
    101041400,
    101041500,
    101041600,
    101041700,
    101041800,
    101041900,
    101042000,
    101042100,
    101042200,
    101042300,
    101042400,
    101042500,
    101042600,
    101042700,
    101042800,
    101042900,
    101043000,
    101043100,
    101043200,
    101043300,
    101043400,
    101043600,
    101050101,
    101050102,
    101050103,
    101050104,
    101050105,
    101050106,
    101050107,
    101050108,
    101050109,
    101050110,
    101050111,
    101050112,
    101050113,
    101050201,
    101050202,
    101050203
];
// var dump = require("utils").dump;
// script argument
// casper.log("Casper CLI passed args:",'info');
// dump(casper.cli.args);


// filter the png & jpg, to speed up
casper.on('resource.requested', function (request) {
//if (/\.(png|jpg)$/i.test(request.url)) {
    // 过滤广告链接
    if (/(google|tanx|toruk|tq121|tongji|googlesyndication|taobao|taobaocdn|googlesyndication|doubleclick|baidu)/i.test(request.url)) {
        //this.log("Abort resource.requested:" + request.url,'info');
        request.abort();
    } else {
        //this.log("Resource.requested:" + request.url, 'info');
    }
});

//casper.on('navigation.requested', function (url, navigationType, navigationLocked, isMainFrame) {
//    //this.log("navigation.requested:" + url + " " + navigationType + " " + navigationLocked + " " + isMainFrame, 'info');
//});
//
//casper.on('page.resource.requested', function (requestData, request) {
//    //this.log("page.resource.requested:" + requestData.url, 'info');
//
//});
//
//casper.on('load.finished', function (status) {
//    //this.log("load.finished:" + status, 'info');
//
//});

casper.getHTML = function getHTML(selector, outer) {
    "use strict";
    this.checkStarted();
    if (!selector) {
        return this.page.frameContent;
    }
    return this.evaluate(function getSelectorHTML(selector, outer) {
        var element = __utils__.findOne(selector);
        return outer ? element.outerHTML : element.innerHTML;
    }, selector, !!outer);
};
function send(host, result) {
    try {
        return __utils__.sendAJAX(host, 'POST', result, false,
            {
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            });
    } catch (e) {
        __utils__.log("Server error:" + e, 'error');
    }
}

function grab(cityId) {
    var start = new Date().getTime();
    var result = {};
    this.waitForSelector("div.fl h1", (function () {
        // -------------  Today weather --------------
        result["cityId"] = cityId;
        var city = this.getHTML('div.cityName.clearfix div.fl h2');
        if (city === null) {
            result["city"] = this.getHTML('div.cityName.clearfix div.fl h3');
        } else {
            result['city'] = city;
        }
        result["district"] = this.getHTML('div.cityName.clearfix div.fl h1');
        result["temp"] = this.getHTML('p.tem span');
        //风向
        var wd = this.getElementAttr('span.sp2', 'title');
        if (wd != null) {
            result["wd"] = wd;
        }
        //风级
        var ws = this.getHTML('span.sp2');
        if (ws != null) {
            result["ws"] = ws.replace(/[^0-9]/ig, "");
        }
        //湿度
        var sd = this.getHTML('span.sp1');
        if (sd != null) {
            result["sd"] = sd.replace(/[^0-9]/ig, "");
        }
        var time = this.getHTML('#today  span');
        if (time != null) {
            result["time"] = time.replace(/[^0-9:]/ig, "");
        }
        var now = new Date();
        result["sysdate"] = now.getHours() + ":" + now.getMinutes();
        // -------------  Today sunrise & sunset ------
        var sunrise = this.getHTML("p.sunUp");
        if (sunrise != null) {
            result["sunrise"] = sunrise.replace(/[^0-9:]/ig, "");
        }
        var sunset = this.getHTML("p.sunDown");
        if (sunset != null) {
            result["sunset"] = sunset.replace(/[^0-9:]/ig, "");
        }
        // -------------  Today suggestion ------------
        //穿衣
        result["cyint"] = this.getHTML("section.mask section.ct b");
        result["cydes"] = this.getHTML("section.mask section.ct aside").split("</b>")[1];
        //感冒
        result["gmint"] = this.getHTML("section.mask section.gm b");
        result["gmdes"] = this.getHTML("section.mask section.gm aside").split("</b>")[1];
        //紫外线
        result["uvint"] = this.getHTML("section.mask section.uv b");
        result["uvdes"] = this.getHTML("section.mask section.uv aside").split("</b>")[1];
        //洗车
        result["xcint"] = this.getHTML("section.mask section.xc b");
        result["xcdes"] = this.getHTML("section.mask section.xc aside").split("</b>")[1];
        //太阳镜
        result["tyjint"] = this.getHTML("section.mask section.gl b");
        result["tyjdes"] = this.getHTML("section.mask section.gl aside").split("</b>")[1];
        //旅游
        result["trint"] = this.getHTML("section.mask section.tr b");
        result["trdes"] = this.getHTML("section.mask section.tr aside").split("</b>")[1];
        //美容
        result["mint"] = this.getHTML("section.mask section.gm b");
        result["nydes"] = this.getHTML("section.mask section.gm aside").split("</b>")[1];
        //晨练
        result["clint"] = this.getHTML("section.mask section.cl b");
        result["cldes"] = this.getHTML("section.mask section.cl aside").split("</b>")[1];
        //过敏
        result["agint"] = this.getHTML("section.mask section.ag b");
        result["agdes"] = this.getHTML("section.mask section.ag aside").split("</b>")[1];
        //雨伞
        result["ysint"] = this.getHTML("section.mask section.ys b");
        result["ysdes"] = this.getHTML("section.mask section.ys aside").split("</b>")[1];
        //运动
        result["ydint"] = this.getHTML("section.mask section.yd b");
        result["iddes"] = this.getHTML("section.mask section.yd aside").split("</b>")[1];
        //化妆
        result["hzint"] = this.getHTML("section.mask section.pp b");
        result["hzdes"] = this.getHTML("section.mask section.pp aside").split("</b>")[1];
        //舒适度
        result["ssdint"] = this.getHTML("section.mask section.co b");
        result["ssdes"] = this.getHTML("section.mask section.co aside").split("</b>")[1];

        this.log('Grab data in ' + (now.getTime() - start) + 'ms', 'info');
        // ---------------- 发送给收集端 ---------------
        //var response = this.evaluate(send, {host: host, result: result});
        //this.log("Server response:" + response, 'debug');
        //----------------- 调试输出 -----------
        utils.dump(result);
    }), (function () {
        this.die(this.getCurrentUrl() + " timeout reached.");
    }), 12000);


}
//手机版
//function grabFuture(cityId) {
//    var result = {};
//    result["cityId"] = cityId;
//    this.evaluate(function (host, result) {
//        var futures = __utils__.querySelectorAll("div.days7 li");
//        for (var i = 0, j = futures.length; i < j; i++) {
//            //天气图片标题，多云或者晴
//            var img = futures[i].querySelectorAll("i img");
//            var before = img[0].getAttribute("alt");
//            var after = img[1].getAttribute("alt");
//            result["img_title" + (i + 1)] = before;
//            result["img_title" + (i + 2)] = after;
//            //天气转变，多云转晴
//            if (before === after) {
//                result["weather" + (i + 1)] = before;
//            } else {
//                result["weather" + (i + 1)] = before + "转" + after;
//            }
//            //温度,5°/10°
//            result["temp" + (i + 1)] = futures[i].querySelector("span").innerHTML;
//            //天气图标号码
//            var link1 = img[0].getAttribute("src");
//            var link2 = img[1].getAttribute("src");
//            result["img" + (i + 1)] = link1.charAt(link1.length - 5);
//            result["img" + (i + 2)] = link2.charAt(link1.length - 5);
//
//        }
//
//    }, {host: host, result: result})
//}
//网页版
function grabFuture(cityId) {
    var start = new Date().getTime();
    var result = {};
    result["cityId"] = cityId;
    var city = this.getHTML('div.cityName.clearfix div.fl h2');
    if (city === null) {
        result["city"] = this.getHTML('div.cityName.clearfix div.fl h3');
    } else {
        result['city'] = city;
    }
    result["date"] = this.getHTML('#tabDays > p').replace(/[^0-9:-\s]/ig, "");
    result["district"] = this.getHTML('div.cityName.clearfix div.fl h1');
    var now = new Date();
    result["sysdate"] = now.getHours() + ":" + now.getMinutes();
    this.evaluate(function (host, result) {
        var futures = __utils__.querySelectorAll("ul.t.clearfix li.dn");
        for (var i = 0, j = futures.length; i < j; i++) {
            //天气图片标题，多云或者晴
            var img_title = futures[i].querySelector("p.wea").innerHTML;
            if (img_title.indexOf("转") != -1) {
                var titles = img_title.split("转");
                result["img_title" + (i + 1)] = titles[0];
                result["img_title" + (i + 2)] = titles[1];
            } else {
                result["img_title" + (i + 1)] = img_title;
                result["img_title" + (i + 2)] = img_title;
            }
            //天气转变，多云转晴
            result["weather" + (i + 1)] = img_title;
            //温度,5°/10°
            var temp = futures[i].querySelectorAll("p.tem span");
            result["temp" + (i + 1)] = temp[0].innerHTML + '/' + temp[1].innerHTML;
            //天气图标号码
            var img = futures[i].querySelectorAll("big");
            var num1 = img[0].getAttribute("class").split(" ")[1].charAt(2);
            var num2 = img[1].getAttribute("class").split(" ")[1].charAt(2);
            result["img" + (i + 1)] = num1;
            result["img" + (i + 2)] = num2;
            //风向
            var fx = futures[i].querySelectorAll("p.win span");
            result["fx" + (i + 1)] = fx[0].getAttribute("title");
            result["fx" + (i + 2)] = fx[1].getAttribute("title");
            result["fl" + (i + 1)] = futures[i].querySelector("p.win i").innerHTML;
            result["fl" + (i + 2)] = futures[i].querySelector("p.win i").innerHTML;

        }
        utils.dump(result);
        this.log('Grab data in ' + (now.getTime() - start) + 'ms', 'info');
    }, {host: host, result: result});
}

casper.start();

//执行当天天气抓取
casper.each(cityIds, function (self, cityId) {
    var link = "http://www.weather.com.cn/weather1d/" + cityId + ".shtml";
    self.log("-----------today weather link:" + link, 'info');
    self.thenOpen(link, function () {
        grab.call(this, cityId)
    });
});

//执行7天预测天气抓取
//casper.each(cityIds, function (self, cityId) {
//    var link = "http://www.weather.com.cn/weather/" + cityId + ".shtml";
//    self.log("-----------future weather link:" + link, 'info');
//    self.thenOpen(link, function () {
//        grabFuture.call(this, cityId)
//    });
//});


//运行
casper.run(function () {
    //运行完毕推出
    casper.exit();
});
