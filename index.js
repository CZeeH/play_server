const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const uploadFile = require('./oss/index');
const bodyParser = require('body-parser');
const { findAll, insert, update, deleteOne, batchUpdate } = require('./db');

const app = express();
const port = 3000;

const dateRegex = /^\d{6}-\d{15}$/;
const origin_inner = 'http://localhost:5173'
const origin_online = 'http://47.99.132.17:3889'
/**CORS配置 */
const corsOptions = {
    origin: origin_online,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
/**生成随机字符串 */
const generateRandomString = (length) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    return randomString;
}
/**multer配置 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 指定文件上传的目录
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const randomString = generateRandomString(12)
        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 月份是从 0 开始的，所以要加 1
        const day = now.getDate();
        const ext = path.extname(file.originalname);
        // 自定义文件名
        cb(null, `${year}${month}${day}-payment-${randomString}${ext}`);
    }
});

const upload = multer({ storage: storage });


/**请求处理 图片上传并返回链接*/
app.post('/upload', upload.single('paymentCode'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('未上传文件');
        }
        const url = await uploadFile(req.file.filename, req.file.path)
        res.send({
            msg: '文件上传成功',
            filename: req.file.filename,
            fileurl: url,
            code: 200
        });
    } catch (err) {
        console.error('文件上传失败:', err);
        res.status(500).send('文件上传失败');
    }
});

/**信息提交 */
app.post('/submit', async (req, res) => {
    try {
        const { order_id } = req.body
        const isMatch = order_id.match(dateRegex) !== null
        if (!isMatch) {
            res.send({
                msg: '订单号不合法',
                code: 200,
                success: true
            });
        }
        const result = await insert('playSubmitCol', req.body)
        console.log(result)
        res.status(200).send(result)
        // res.status(500).send(result);

    } catch (err) {
        console.error('上传结算信息失败:', err);
        res.status(500).send({
            msg: '上传结算信息失败',
            success: false
        });
    }
});

/**结算列表 */
app.get('/ordertable_search', async (req, res) => {
    try {
        const { skip = 0, limit = 10, ...query } = req.query
        const result = await findAll('playSubmitCol', query, { skip: Number(skip), limit: Number(limit) })
        res.status(200).send(result);
    } catch (err) {
        console.error('获取结算列表失败:', err);
        res.status(500).send({
            msg: '获取结算列表失败',
            success: false
        });
    }
});

app.post('/update_payment', async (req, res) => {
    try {
        const { filter, updateDoc } = req.body || {}
        const result = await update('playSubmitCol', filter, updateDoc)
        res.status(200).send(result);

    } catch (err) {
        console.error('数据更新失败:', err);
        res.status(500).send({
            msg: '更新失败',
            code: 500
        });
    }
});
/**批量更新 */
app.post('/batch_update', async (req, res) => {
    try {
        const { filter, updateDoc } = req.body || {}
        const result = await batchUpdate('playSubmitCol', filter, updateDoc)
        res.status(200).send(result);

    } catch (err) {
        console.error('数据更新失败:', err);
        res.status(500).send({
            msg: '更新失败',
            code: 500
        });
    }
});

/**列表删除 */
app.get('/delete_record', async (req, res) => {
    try {
        console.log(req.query.order_id)
        const result = await deleteOne('playSubmitCol', { order_id: req.query.order_id })
        res.status(200).send(result);
    } catch (err) {
        console.error('删除记录失败:', err);
        res.status(500).send({
            msg: '删除记录失败',
            success: false
        });
    }
});
/** 新建订单 */
app.post('/create_order', async (req, res) => {
    try {
        const random_string = generateRandomString(24)
        const random_url = `${origin}/#/pick?key=${random_string}`
        const data = { ...req.body, random_url, random_string }
        const result = await insert('orderListCol', data)
        console.log(result)
        res.status(200).send({ ...result, random_url, random_string })
        // res.status(500).send(result);
    } catch (err) {
        console.error('上传结算信息失败:', err);
        res.status(500).send({
            msg: '上传结算信息失败',
            success: false
        });
    }
});

/** 更新订单数据 */
app.post('/update_order', async (req, res) => {
    try {
        const { filter, updateDoc } = req.body || {}
        const result = await update('orderListCol', filter, updateDoc)
        console.log(result)
        res.status(200).send(result)
    } catch (err) {
        console.error('更新订单信息失败:', err);
        res.status(500).send({
            msg: '更新订单信息失败',
            success: false
        });
    }
});
/** 获取订单列表 */
app.get('/get_create_orderlist', async (req, res) => {
    try {
        const { skip = 0, limit = 10, ...query } = req.query
        const result = await findAll('orderListCol', query, { skip: Number(skip), limit: Number(limit) })
        res.status(200).send(result);
    } catch (err) {
        console.error('获取订单列表失败:', err);
        res.status(500).send({
            msg: '获取订单列表失败',
            success: false
        });
    }
});

/**生成订单列表删除 */
app.get('/delete_order', async (req, res) => {
    try {
        console.log('数据删除中，删除id：', req.query.order_id)
        const result = await deleteOne('orderListCol', { order_id: req.query.order_id })
        res.status(200).send(result);
    } catch (err) {
        console.error('删除记录失败:', err);
        res.status(500).send({
            msg: '删除记录失败',
            success: false
        });
    }
});




// 启动 Express 服务器
app.listen(port, () => {
    console.log(`服务运行在 http://localhost:${port}`);
});
