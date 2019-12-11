/*使用tts api生成配音音频文件*/
const {Base64} = require("./base64js");
const CryptoJS = require("./hmac-sha256");
const encBase64Min = require("./enc-base64-min");
const transformWorker = require("./transform.worker");
const WebSocket = require("ws");
const fs = require("fs");
const {Buffer} = require("buffer");
encBase64Min(CryptoJS);

//APPID，APISecret，APIKey在控制台-我的应用-语音合成（流式版）页面获取
const APPID = '5bdf9a98'
const API_SECRET = 'c33909cb39f8cff0b5d2580186655aa9'
const API_KEY = 'aa5d125de1c19bc749f447dc12ecce24'

// 合成讯飞tts需要的验证url
function getWebsocketUrl () {
  return new Promise((resolve, reject) => {
    var apiKey = API_KEY
    var apiSecret = API_SECRET
    var url = 'wss://tts-api.xfyun.cn/v2/tts'
    var host = "tts-api.xfyun.cn"
    var date = new Date().toGMTString()
    var algorithm = 'hmac-sha256'
    var headers = 'host date request-line'
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    var signature = CryptoJS.enc.Base64.stringify(signatureSha)
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    var authorization = Base64.btoa(authorizationOrigin)
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
    resolve(url)
  })
}

// 从tts api获取wav格式数据
// 此方法需要同步调用
function getData(url,params){
	// 用来保存合成的音频数据
	// 因为接口可能分几次发送数据
	// 所以需要客户端进行缓存并拼接
	let rawData = [];
	return new Promise((resolve,reject)=>{
		// 通过websocket连接tts url
		let ws = new WebSocket(url);
		// 连接成功后
		// 发送需要合成的配音文字到tts服务器
		ws.on("open",()=>{
		    ws.send(JSON.stringify(params));
		});
		// 接收到tts服务器返回的数据之后
		// 判断是否合成成功
		// 将合成成功的数据拼接到数组中
		// 因为服务器可能会分几次发送数据
		ws.on("message",(e)=>{
			let jsonData = JSON.parse(e);
			// 合成失败
			if (jsonData.code !== 0) {
				console.log(`${jsonData.code}:${jsonData.message}`);
				ws.close();
				return;
			}
			// 把返回的base64编码的音频数据转换成字节数组
			let tempData = transformWorker(jsonData.data.audio);
			// 往rawData数组中追加tempData数组
			rawData.push.apply(rawData,tempData);
			// 合成完成
			if (jsonData.code === 0 && jsonData.data.status === 2) {
				let data = new Uint8Array(rawData);
				let pcmData = Buffer.from(data.buffer);
				ws.close();
				// 返回wavData
				resolve(pcmData);
			}
		});
		// websocket出错处理
		ws.on("error",(e)=>{
			console.log(e);
		});
		// websocket关闭事件处理
		ws.on("close",(e)=>{
			ws = null;
		});
	});
}

module.exports = async function getPcmData(text){
	// 音频参数，之后要可以配置
	let params = {
		'common': {
			'app_id': APPID // APPID
		},
		'business': {
			'aue': 'raw',
			'vcn': 'aisjiuxu',
			'tte': 'UTF8'
		},
		'data': {
			'status': 2,
			'text': Base64.encode(text)
		}
	};
	let url = await getWebsocketUrl();
	return await getData(url,params);
}