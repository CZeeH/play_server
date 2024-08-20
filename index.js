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
let origin = origin_online
const originArr = ['http://192.168.1.11:5173', 'http://192.168.1.1:5173', 'http://47.99.132.17:3889', 'http://localhost:5173']
const orderStatus = {
    unSubmitted: '1',
    unAssigned: '2',
    Assigned: '3'
}
/**CORS配置 */
const corsOptions = {
    origin: (origin, callback) => {
        if (originArr.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
        const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const random_url = `${origin}/#/pick?key=${random_string}`
        const data = { ...req.body, random_url, random_string }
        const result = await insert('orderListCol', data)
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

/**生成接单凭证 */
app.get('/create_get_order_token', async (req, res) => {
    try {

        const { work_qq, work_wx } = req.query
        const get_order_token = `${generateRandomString(10)}-${generateRandomString(6)}`
        const result = await insert('orderTokenCol', { work_qq, work_wx, get_order_token })
        res.status(200).send({ ...result, get_order_token, msg: '生成凭证成功' });
    } catch (err) {
        console.error('生成凭证失败:', err);
        res.status(500).send({
            msg: '生成凭证失败',
            success: false
        });
    }
});

/** 获取接单凭证列表 */
app.get('/get_order_token_list', async (req, res) => {
    try {
        const { skip = 0, limit = 10, ...query } = req.query
        const result = await findAll('orderTokenCol', query, { skip: Number(skip), limit: Number(limit) })
        res.status(200).send(result);
    } catch (err) {
        console.error('获取凭证列表失败:', err);
        res.status(500).send({
            msg: '获取凭证列表失败',
            success: false
        });
    }
});

/**删除接单凭证 */
app.get('/delete_order_token', async (req, res) => {
    try {
        console.log('数据删除中，删除凭证：', req.query)
        const result = await deleteOne('orderTokenCol', { get_order_token: req.query.get_order_token })
        res.status(200).send(result);
    } catch (err) {
        console.error('删除凭证失败:', err);
        res.status(500).send({
            msg: '删除凭证失败',
            success: false
        });
    }
});

/** 获取接单凭证列表 */
app.get('/check_order_token', async (req, res) => {
    try {

        const { get_order_token } = req.query
        const result = await findAll('orderTokenCol', { get_order_token }, { skip: 0, limit: 10 })
        if (result.total !== 1) {
            res.status(200).send({ ...result, msg: '凭证有问题 请联系管理员', success: false })
            return
        }
        res.status(200).send({ ...result, msg: '凭证合格 开始接单', success: true })
    } catch (err) {
        console.error('获取凭证列表失败:', err);
        res.status(500).send({
            msg: '获取凭证列表失败',
            success: false
        });
    }
});

/** 检查陪玩凭证 并检查是否能接单*/
app.post('/check_order_token_and_get_order', async (req, res) => {
    try {
        const { filter, updateDoc } = req.body || {}
        // // 检查是否凭证ok
        // const { get_order_token } = updateDoc 
        // const result1 = await findAll('orderTokenCol', { get_order_token }, { skip: 0, limit: 10 })
        // if (result1.total !== 1) {
        //     res.status(200).send({ ...result1, msg: '凭证有问题 请联系管理员', success: false })
        //     return
        // }
        // const { order_id } = filter
        // const query = { order_id, order_status: orderStatus.unAssigned, }
        // console.log('query --- ',query)
        // const result2 = await findAll('orderListCol', query, { skip:0, limit: 10, })
        // if (result2.total === 0) {
        //     res.status(200).send({ ...result2, msg: '订单已经被抢走了 下次手快点吧', success: false })
        //     return
        // }
        const result = await update('orderListCol', filter, updateDoc)
        result.success ? res.status(200).send({ ...result, msg: "抢单成功 先去联系老板哦" }) :
            res.status(200).send({ ...result, msg: "抢单失败" })

    } catch (err) {
        console.error('抢单失败 请联系管理员', err);
        res.status(500).send({
            msg: '抢单失败 请联系管理员',
            success: false
        });
    }
});



// 启动 Express 服务器 当前的前端配置是:${corsOptions.origin}
app.listen(port, () => {
    console.log(`服务运行在 http://localhost:${port} `);
});
