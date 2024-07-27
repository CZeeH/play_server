const OSS = require('ali-oss');
const fs = require('fs');
require('dotenv').config();


// 初始化OSS客户端。请将以下参数替换为您自己的配置信息。
const client = new OSS({
    region: 'oss-cn-hangzhou', // 示例：'oss-cn-hangzhou'，填写Bucket所在地域。
    accessKeySecret: process.env.MY_SECRET_KEY, // 确保已设置环境变量OSS_ACCESS_KEY_SECRET。
    accessKeyId: process.env.MY_SECRET_ID, // 确保已设置环境变量OSS_ACCESS_KEY_ID。
    bucket: 'play-list-for-pic', // 示例：'my-bucket-name'，填写存储空间名称。
});

async function uploadFile(filename, filePath) {
    try {
        // 上传文件到OSS，'object'是OSS中的文件名，'localfile'是本地文件的路径。
        // 获取本地文件的绝对路径
        // const localFilePath = path.resolve(__dirname, '2024712-payment-IUjP8jDIYkw0.jpg');
        // // 读取本地文件为Buffer
        const fileContent = fs.readFileSync(filePath);

        // 上传文件到OSS
        // 然后使用该路径进行上传
        const uploadResult = await client.put(filename, fileContent);
        console.log('上传成功:', uploadResult, 'file_url:', uploadResult.url);
        return uploadResult.url
        // 从OSS下载文件以验证上传成功。
        // const getResult = await client.get('pic/file.jpg');
        // console.log('获取文件成功:', getResult);
    } catch (error) {
        console.error('发生错误:', error);
        return
        // 在此处添加错误处理逻辑。
    }
}
// uploadAndDownloadFile()
module.exports = uploadFile;