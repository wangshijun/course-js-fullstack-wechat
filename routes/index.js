var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const jssdk = require('../libs/jssdk');

/* GET home page. */
router.get('/wechat/hello', function(req, res, next) {
    jssdk.getSignPackage(`http://120.27.106.168${req.url}`, function (err, signPackage) {
        if (err) {
            return next(err);
        }

        // Jade Template
        res.render('index', {
            title: 'Hello Wechat from Aliyun ECS --> Express',
            signPackage: signPackage,
            pretty: true,
        });
    });
});

const token = 'f9ZDwSilaZxjdGx0TQ4u';
const handleWechatRequest =  function (req, res, next) {
    const { signature, timestamp, nonce, echostr } = req.query;
    if (!signature || !timestamp || !nonce) {
        return res.send('invalid request');
    }
    if (req.method === 'POST') {
        console.log('handleWechatRequest.post:', { body: req.body, query: req.query });
    }
    if (req.method === 'GET') {
        console.log('handleWechatRequest.get:', { get: req.body });
        if (!echostr) {
            return res.send('invalid request');
        }
    }

    // 将token、timestamp、nonce三个参数进行字典序排序
    const params = [token, timestamp, nonce];
    params.sort();

    // 将三个参数字符串拼接成一个字符串进行sha1加密
    const hash = crypto.createHash('sha1');
    const sign = hash.update(params.join('')).digest('hex');

    // 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if (signature === sign) {
        if (req.method === 'GET') {
            res.send(echostr ? echostr : 'invalid request');
        } else {
            const tousername = req.body.xml.tousername[0].toString();
            const fromusername = req.body.xml.fromusername[0].toString();
            const createtime = Math.round(Date.now() / 1000);
            const msgtype = req.body.xml.msgtype[0].toString();
            const content = req.body.xml.content[0].toString();
            const msgid = req.body.xml.msgid[0].toString();

            const response = `<xml>
    <ToUserName><![CDATA[${fromusername}]]></ToUserName>
    <FromUserName><![CDATA[${tousername}]]></FromUserName>
    <CreateTime>${createtime}</CreateTime>
    <MsgType><![CDATA[${msgtype}]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
</xml>`;

            res.set('Content-Type', 'text/xml');
            res.send(response);
        }
    } else {
        res.send('invalid sign');
    }
};

router.get('/api/wechat', handleWechatRequest);
router.post('/api/wechat', handleWechatRequest);

module.exports = router;
