const fs = require("fs");
const stream = require("stream");
const {FileWriter} = require('wav');

// 将PCM数据转换成WAV数据并写入文件
module.exports = async function(pcmData,fileName){
	let inputStream = stream.PassThrough();
	let outputFileStream = new FileWriter(fileName, {
		dataLength: pcmData.length,
		sampleRate: 16000,
		channels: 1
	});
	inputStream.end(pcmData);
	inputStream.pipe(outputFileStream);
};
