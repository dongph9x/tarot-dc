const { MongoClient } = require('mongodb');

// Kết nối MongoDB
let db = null;
let client = null;
let isConnected = false;

/**
 * Kết nối đến MongoDB
 */
async function connectToDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        const dbName = process.env.MONGODB_DB || 'tarot_bot';
        
        client = new MongoClient(uri);
        await client.connect();
        
        db = client.db(dbName);
        isConnected = true;
        console.log('✅ Đã kết nối thành công đến MongoDB');
        
        // Tạo index cho collection user_usage
        const userUsageCollection = db.collection('user_usage');
        await userUsageCollection.createIndex({ userId: 1, date: 1 }, { unique: true });
        await userUsageCollection.createIndex({ date: 1 }, { expireAfterSeconds: 86400 }); // TTL 24 giờ
        
        return db;
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        console.log('⚠️ Bot sẽ hoạt động với fallback mode (không lưu trữ quota)');
        isConnected = false;
        throw error;
    }
}

/**
 * Lấy database instance
 */
function getDatabase() {
    if (!isConnected || !db) {
        throw new Error('Database chưa được kết nối. Hãy gọi connectToDatabase() trước.');
    }
    return db;
}

/**
 * Kiểm tra database có kết nối không
 */
function isDatabaseConnected() {
    return isConnected && db !== null;
}

/**
 * Lưu usage data của user
 * @param {string} userId - ID của user
 * @param {string} commandName - Tên command
 * @param {Object} usageData - Dữ liệu usage
 */
async function saveUserUsage(userId, commandName, usageData) {
    if (!isDatabaseConnected()) {
        console.log('⚠️ Database không khả dụng, bỏ qua lưu usage data');
        return;
    }

    try {
        const collection = getDatabase().collection('user_usage');
        
        const filter = { userId, date: usageData.date };
        const update = {
            $set: {
                userId,
                date: usageData.date,
                lastUpdated: new Date()
            },
            $inc: {
                [`commands.${commandName}`]: 1,
                totalTarotCommands: usageData.isTarotCommand ? 1 : 0
            }
        };
        
        await collection.updateOne(filter, update, { upsert: true });
    } catch (error) {
        console.error('❌ Lỗi lưu user usage:', error);
        // Không throw error để bot vẫn hoạt động
    }
}

/**
 * Lấy usage data của user
 * @param {string} userId - ID của user
 * @param {string} date - Ngày (format: YYYY-MM-DD)
 * @returns {Object} Usage data
 */
async function getUserUsage(userId, date) {
    if (!isDatabaseConnected()) {
        console.log('⚠️ Database không khả dụng, trả về data mặc định');
        return {
            userId,
            date,
            commands: {},
            totalTarotCommands: 0,
            lastUpdated: new Date()
        };
    }

    try {
        const collection = getDatabase().collection('user_usage');
        
        const result = await collection.findOne({ userId, date });
        
        if (!result) {
            return {
                userId,
                date,
                commands: {},
                totalTarotCommands: 0,
                lastUpdated: new Date()
            };
        }
        
        return result;
    } catch (error) {
        console.error('❌ Lỗi lấy user usage:', error);
        // Trả về data mặc định nếu có lỗi
        return {
            userId,
            date,
            commands: {},
            totalTarotCommands: 0,
            lastUpdated: new Date()
        };
    }
}

/**
 * Reset usage data cho ngày mới
 * @param {string} userId - ID của user
 * @param {string} newDate - Ngày mới
 */
async function resetUserUsageForNewDay(userId, newDate) {
    if (!isDatabaseConnected()) {
        console.log('⚠️ Database không khả dụng, bỏ qua reset usage data');
        return;
    }

    try {
        const collection = getDatabase().collection('user_usage');
        
        // Xóa dữ liệu cũ nếu có
        await collection.deleteOne({ userId, date: { $ne: newDate } });
        
        // Tạo entry mới cho ngày mới
        await collection.updateOne(
            { userId, date: newDate },
            {
                $setOnInsert: {
                    userId,
                    date: newDate,
                    commands: {},
                    totalTarotCommands: 0,
                    lastUpdated: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('❌ Lỗi reset user usage:', error);
        // Không throw error để bot vẫn hoạt động
    }
}

/**
 * Đóng kết nối database
 */
async function closeDatabase() {
    if (client) {
        await client.close();
        isConnected = false;
        console.log('✅ Đã đóng kết nối MongoDB');
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    saveUserUsage,
    getUserUsage,
    resetUserUsageForNewDay,
    closeDatabase,
    isDatabaseConnected
}; 