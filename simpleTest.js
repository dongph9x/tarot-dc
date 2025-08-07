// Simple test để kiểm tra database connection
require('dotenv').config();

const { connectToDatabase, getDatabase, isDatabaseConnected } = require('./database');

async function simpleTest() {
    console.log('🧪 Simple Test - Kiểm tra Database Connection');
    
    try {
        // Kết nối database
        console.log('📡 Đang kết nối database...');
        await connectToDatabase();
        
        // Kiểm tra kết nối
        if (isDatabaseConnected()) {
            console.log('✅ Database đã kết nối thành công!');
            
            const db = getDatabase();
            
            // Test tạo collection
            console.log('🗄️ Test tạo collection...');
            const collection = db.collection('test_collection');
            await collection.insertOne({ test: 'data', timestamp: new Date() });
            console.log('✅ Đã tạo và insert dữ liệu test');
            
            // Test đọc dữ liệu
            const result = await collection.findOne({ test: 'data' });
            console.log('📖 Dữ liệu đọc được:', result);
            
            // Dọn dẹp
            await collection.deleteMany({ test: 'data' });
            console.log('🧹 Đã dọn dẹp dữ liệu test');
            
        } else {
            console.log('❌ Database chưa kết nối');
        }
        
    } catch (error) {
        console.error('❌ Lỗi test:', error);
    }
}

simpleTest(); 