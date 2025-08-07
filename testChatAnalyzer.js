// Test Chat Analyzer với prompt tùy chỉnh và thông báo
require('dotenv').config();
const { getDatabase } = require('./database');
const { 
    saveMessageToDatabase, 
    startChatAnalysisScheduler, 
    getChatAnalyzerStats,
    CHAT_ANALYZER_CONFIG 
} = require('./chatAnalyzer');

// Mock Discord client
const mockClient = {
    users: {
        fetch: async (userId) => ({
            id: userId,
            username: `User_${userId}`,
            send: async (message) => {
                console.log(`📤 Mock DM sent to ${userId}:`, message.embeds[0].title);
            }
        })
    }
};

// Mock Discord message
const createMockMessage = (content, authorName = 'testuser', messageId = '123') => ({
    id: messageId,
    author: {
        id: '123456789',
        username: authorName,
        bot: false
    },
    content: content,
    channelId: process.env.TARGET_CHANNEL_ID,
    createdAt: new Date()
});

async function testChatAnalyzer() {
    console.log('🧪 Bắt đầu test Chat Analyzer...');
    
    try {
        // Kết nối database
        const db = getDatabase();
        console.log('✅ Database connected');
        
        // Test cấu hình
        console.log('\n📋 Cấu hình Chat Analyzer:');
        console.log('- Enabled:', CHAT_ANALYZER_CONFIG.ENABLED);
        console.log('- Target Channel:', CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID);
        console.log('- Custom Prompt:', CHAT_ANALYZER_CONFIG.CUSTOM_PROMPT ? 'Có' : 'Không');
        console.log('- Notification Enabled:', CHAT_ANALYZER_CONFIG.NOTIFICATION_ENABLED);
        console.log('- Notification Users:', CHAT_ANALYZER_CONFIG.NOTIFICATION_USER_IDS);
        
        // Test lưu tin nhắn
        console.log('\n📝 Test lưu tin nhắn...');
        const testMessages = [
            createMockMessage('Chúng ta cần thảo luận về dự án mới', 'user1', 'msg1'),
            createMockMessage('Tôi đồng ý, đây là quyết định quan trọng', 'user2', 'msg2'),
            createMockMessage('Dự án này sẽ thay đổi hoàn toàn cách chúng ta làm việc', 'user3', 'msg3'),
            createMockMessage('Chào mọi người', 'user4', 'msg4'),
            createMockMessage('👍', 'user5', 'msg5')
        ];
        
        for (const message of testMessages) {
            await saveMessageToDatabase(db, message);
        }
        
        // Test phân tích
        console.log('\n🔍 Test phân tích chat...');
        const { startChatAnalysisScheduler } = require('./chatAnalyzer');
        startChatAnalysisScheduler(db, mockClient);
        
        // Đợi một chút để phân tích hoàn thành
        setTimeout(async () => {
            console.log('\n📊 Thống kê sau phân tích:');
            const stats = await getChatAnalyzerStats(db);
            console.log('- Total Messages:', stats.totalMessages);
            console.log('- Pending Messages:', stats.pendingMessages);
            console.log('- Important Logs:', stats.importantLogs);
            console.log('- Today Messages:', stats.todayMessages);
            
            console.log('\n✅ Test hoàn thành!');
            process.exit(0);
        }, 5000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
    testChatAnalyzer();
}

module.exports = { testChatAnalyzer }; 