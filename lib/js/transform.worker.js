/**
 * Created by lycheng on 2019/8/9.
 */

module.exports = function (data) {
	let rawData = Base64.atob(data);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
