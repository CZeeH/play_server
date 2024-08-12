const { MongoClient, MongoServerError } = require('mongodb');
// 本地db地址
const uri = "mongodb+srv://956100390:a956100390@cluster0.ph2wb8c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const uri = "mongodb://player_server_db:a956100390@47.99.132.17:27017/player_server_db";
// 服务器数据库db
// mongo mongodb://player_server_db:a956100390@47.99.132.17:27017/player_server_db
const settlementCollection = 'playSubmitCol'; // 订单处理列表
const orderCollection = 'orderListCol'; // 订单生成列表
const dbName = 'playSettlement';
// playSettlement.playSubmitCol

const client = new MongoClient(uri);


/**
 * 
 * 结算列表查询
 * whichCol: 选择collection
 * query : 查询条件
 * options：限制 默认返回前10
 *  */
async function findAll(whichCol,query = {}, options = { skip: 0, limit: 10 }) {
    try {
        console.log(whichCol)
        await client.connect();
        console.log('成功连接到 MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(whichCol || settlementCollection);
        const total = await collection.countDocuments(query);
        // 查询集合中的所有文档并转为数组
        console.log(query, options)
        const data = await collection.find(query, options).sort({ add_time: -1 }).toArray();
        console.log('获取到data', data.length)
        return {
            data,
            total: total,
            msg: '列表获取成功',
            success: true
        }
    } catch (e) {
        return {
            msg: '列表获取失败',
            success: false
        }
    }
    finally {
        client.close();
        console.log('已关闭数据库连接');
    }
}

/**
 * 结算列表更新
 * @param {过滤} filter 
 * @param {更新内容} updateDoc 
 * @returns 
 */
async function update(whichCol,filter, updateDoc) {
    try {
        console.log(whichCol,filter,updateDoc)
        await client.connect();
        console.log('update 成功连接到 MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(whichCol || settlementCollection);

        await collection.updateOne(filter, { $set: updateDoc });
        return {
            success: true,
            msg: '更新成功'
        }
    } catch (error) {
        console.error('Error updating document:', error);
        return {
            success: false,
            msg: '更新信息错误，原因未知'
        }
    } finally {
        await client.close();
        console.log('已关闭数据库连接');
    }
}
/**
 * 结算列表批量更新
 * @param {过滤} filter 
 * @param {更新内容} updateDoc 
 * @returns 
 */
async function batchUpdate(whichCol,filter, updateDoc) {
    try {
        await client.connect();
        console.log('update 成功连接到 MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(whichCol || settlementCollection);

        await collection.updateMany({$or:filter}, { $set: updateDoc });
        return {
            success: true,
            msg: '批量更新成功'
        }
    } catch (error) {
        console.error('Error updating document:', error);
        return {
            success: false,
            msg: '批量更新信息错误，原因未知'
        }
    } finally {
        await client.close();
        console.log('已关闭数据库连接');
    }
}
/**
 * 结算列表删除
 * @param {过滤} filter 
 * @returns 
 */
async function deleteOne(whichCol,filter) {
    try {
        await client.connect();
        console.log('deleteOne 成功连接到 MongoDB whichCol:',whichCol,'filter',filter);
        const db = client.db(dbName);
        const collection = db.collection(whichCol || settlementCollection);

        await collection.deleteOne(filter);
        return {
            success: true,
            msg: '删除成功'
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            msg: '删除错误，原因未知'
        }
    } finally {
        await client.close();
        console.log('已关闭数据库连接');
    }
}
/**
 * 结算列表插入
 * @param {项目} item 
 * @returns 
 */
async function insert(whichCol,item) {
    try {
        await client.connect();
        console.log('成功连接到 MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(whichCol || settlementCollection);

        await collection.insertOne(item)
        return {
            success: true,
            msg: '提交成功'
        }
    } catch (error) {
        // 捕获并处理唯一键冲突错误
        if (error instanceof MongoServerError && error.code === 11000) {
            console.error('MongoDB 唯一键冲突错误:', error.message);
            // 可以在此处记录错误或者采取其他处理措施，例如更新现有文档
            return {
                success: false,
                msg: '订单号重复'
            };
        } else {
            console.error('其他错误:', error);
            return {
                success: false,
                msg: '信息错误，原因未知'
            };
        }
    } finally {
        await client.close();
        console.log('已关闭数据库连接');
    }
}

module.exports = { findAll, insert, update, deleteOne,batchUpdate };