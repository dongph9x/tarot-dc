const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cấu hình MongoDB từ file .env
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DB || 'tarot_discord_bot';

// Collections
const COLLECTIONS = {
    MESSAGE_LOGS: 'message_logs',
    IMPORTANT_LOGS: 'important_logs'
};

async function clearAllLogs() {
    let client;
    
    try {
        // Kiểm tra cấu hình
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI không được cấu hình trong file .env');
            return;
        }
        
        console.log('🔗 Kết nối MongoDB...');
        console.log(`📊 Database: ${DATABASE_NAME}`);
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DATABASE_NAME);
        
        console.log('🗑️ Bắt đầu xóa logs...');
        
        // Xóa tất cả record trong message_logs
        console.log('📝 Xóa message_logs...');
        const messageLogsResult = await db.collection(COLLECTIONS.MESSAGE_LOGS).deleteMany({});
        console.log(`✅ Đã xóa ${messageLogsResult.deletedCount} record trong message_logs`);
        
        // Xóa tất cả record trong important_logs
        console.log('⚠️ Xóa important_logs...');
        const importantLogsResult = await db.collection(COLLECTIONS.IMPORTANT_LOGS).deleteMany({});
        console.log(`✅ Đã xóa ${importantLogsResult.deletedCount} record trong important_logs`);
        
        console.log('🎉 Hoàn thành xóa tất cả logs!');
        
    } catch (error) {
        console.error('❌ Lỗi khi xóa logs:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Đã đóng kết nối MongoDB');
        }
    }
}

// Chạy script
if (require.main === module) {
    clearAllLogs();
}

module.exports = { clearAllLogs };
