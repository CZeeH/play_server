const { MongoClient, MongoServerError } = require('mongodb');
// 本地db地址
const uri = "mongodb+srv://956100390:a956100390@cluster0.ph2wb8c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const uri = "mongodb://player_server_db:a956100390@47.99.132.17:27017/player_server_db";
// 服务器数据库db
// mongo mongodb://player_server_db:a956100390@47.99.132.17:27017/player_server_db
const collectionName = 'playSubmitCol';
const dbName = 'playSettlement';

const client = new MongoClient(uri);

/**
 * 全部查询
 * query : 查询条件
 * options：限制 默认返回前10
 *  */
async function findAll(query = {}, options = { skip: 0, limit: 10 }) {
    try {
        await client.connect();
        console.log('成功连接到 MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const total = await collection.countDocuments(query);
        // 查询集合中的所有文档并转为数组
        console.log(query, options)
        const data = await collection.find(query, options).toArray();
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

async function update(filter, updateDoc) {
    try {
        await client.connect();
        console.log('update 成功连接到 MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

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

async function batchUpdate(filter, updateDoc) {
    try {
        await client.connect();
        console.log('update 成功连接到 MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

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

async function deleteOne(filter) {
    try {
        await client.connect();
        console.log('update 成功连接到 MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

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

async function insert(item) {
    try {
        await client.connect();
        console.log('成功连接到 MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

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