const fs = require("fs");
const getPcmData = require("./lib/js/getPcmData");
const writeWavData = require("./lib/js/writeWavData");
const ensureFolder = require("./lib/js/ensureFolder");
const electron = require("electron");
const {app,BrowserWindow,Menu,dialog,ipcMain} = electron;

let stop = false;

function createWindow () {
  // 关闭菜单
  Menu.setApplicationMenu(null);  
  // 创建浏览器窗口
  let win = new BrowserWindow({
    width: 640,
    height: 440,
    minWidth: 640,
    minHeight: 440
  });
  // 打开开发者工具
  // win.webContents.openDevTools()
  // 加载index.html文件
  win.loadFile('index.html')
}

app.on('ready', createWindow);
app.on("window-all-closed",()=>{
  app.quit();
});

ipcMain.on('open-directory-dialog', function (event,p) {
    dialog.showOpenDialog({
      title:"选择配音文件夹",
      properties: [p]
  },function (files) {
    if (files){
      // 如果有选中
      // 发送选择的对象给子进程
      event.sender.send('selectedItem', files[0])
    }
  })
});

// 接收到了开始配音的请求
// 并接收到了配音的内容和配音文件存储的路径
// 开始配音
ipcMain.on("start",async (event,param)=>{
  // 第一步，将文本按换行符转换成字符串数组
  let dubs = strToArray(param.text);
  // 第二步，生成保存音频文件的目录和音频文本的目录
  let folder = param.folder;
  let wavFolder = folder;
  let txtFolder = folder;
  if(folder.charAt(folder.length-1)==="/"){
    wavFolder += "wav/";
    txtFolder += "txt/";
  }else{
    wavFolder += "/wav/";
    txtFolder += "/txt/";
  }
  ensureFolder(wavFolder);
  ensureFolder(txtFolder);
  // 第三步，遍历字符串数组，依次生成音频文件和音频文本
  // 并返回进度信息
  let length = dubs.length;
  for(let i=0;i<length;i++){
    if(stop){
      stop = false;
      return;
    }
    //异步方法的同步调用，获取wav文件数据
    let pcmData = await getPcmData(dubs[i]);
    //同步写入到文件中
    writeWavData(pcmData,`${wavFolder}${i+1}.wav`);
    fs.writeFileSync(`${txtFolder}${i+1}.txt`,dubs[i]);
    updateProgress(event,{percent:(i+1)*100/length,message:dubs[i]});
  }
  // 第四步，调用完成逻辑
  success(event);
});

// 按照回车分割字符串为字符串数组
function strToArray(text){
  return text.split(/[\n\r]+/);
}

// 更新界面
function updateProgress(event,param){
  event.sender.send("updateProgress",param);
}

// 后台处理完成
function success(event){
  event.sender.send("success");
}

// 停止逻辑
ipcMain.on("stop",()=>{
  stop = true;
});

// 打开文件所在路径
ipcMain.on("openFolder",(event,param)=>{
  electron.shell.openExternal(param.folder);
});