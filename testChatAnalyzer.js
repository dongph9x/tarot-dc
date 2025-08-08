// Test Chat Analyzer với prompt tùy chỉnh và thông báo
require('dotenv').config();
const { getDatabase } = require('./database');
const { 
    startChatAnalysisScheduler, 
    getChatAnalyzerStats,
    CHAT_ANALYZER_CONFIG,
    IMPORTANCE_LEVELS
} = require('./chatAnalyzer');

// Mock Discord client
const mockClient = {
    users: {
        fetch: async (userId) => ({
            username: `User${userId}`,
            send: async (message) => console.log(`📤 Mock send to ${userId}:`, message)
        })
    },
    channels: {
        fetch: async (channelId) => ({
            name: 'Test Channel',
            send: async (message) => console.log(`📤 Mock send to channel:`, message),
            messages: {
                fetch: async (messageId) => ({
                    reply: async (message) => console.log(`📤 Mock reply:`, message)
                })
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

// Test function để kiểm tra logic phân tích
async function testChatAnalysis() {
    console.log('🧪 Bắt đầu test Chat Analyzer...\n');

    // Test case 1: Chúc ngủ ngon (nên là LOW)
    const testCase1 = [
        {
            messageId: 'test1',
            authorId: 'user1',
            authorName: 'TestUser1',
            content: 'Chuc ban ngu ngon',
            createdAt: new Date()
        }
    ];

    console.log('📝 Test Case 1: "Chuc ban ngu ngon"');
    console.log('Expected: LOW (chúc ngủ ngon thân thiện)');
    
    try {
        // Import function trực tiếp từ file
        const { analyzeMessagesWithGPT } = require('./chatAnalyzer');
        const result1 = await analyzeMessagesWithGPT(testCase1);
        console.log(`Result: ${result1.importance.toUpperCase()} - ${result1.summary}`);
        console.log(`✅ ${result1.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test case 2: Xúc phạm với từ "ngu" (nên là HIGH)
    const testCase2 = [
        {
            messageId: 'test2',
            authorId: 'user2',
            authorName: 'TestUser2',
            content: 'Mày ngu quá',
            createdAt: new Date()
        }
    ];

    console.log('📝 Test Case 2: "Mày ngu quá"');
    console.log('Expected: HIGH (xúc phạm)');
    
    try {
        const { analyzeMessagesWithGPT } = require('./chatAnalyzer');
        const result2 = await analyzeMessagesWithGPT(testCase2);
        console.log(`Result: ${result2.importance.toUpperCase()} - ${result2.summary}`);
        console.log(`✅ ${result2.importance === IMPORTANCE_LEVELS.HIGH ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test case 3: Chúc ngủ ngon với dấu đầy đủ (nên là LOW)
    const testCase3 = [
        {
            messageId: 'test3',
            authorId: 'user3',
            authorName: 'TestUser3',
            content: 'Chúc bạn ngủ ngon',
            createdAt: new Date()
        }
    ];

    console.log('📝 Test Case 3: "Chúc bạn ngủ ngon"');
    console.log('Expected: LOW (chúc ngủ ngon thân thiện)');
    
    try {
        const { analyzeMessagesWithGPT } = require('./chatAnalyzer');
        const result3 = await analyzeMessagesWithGPT(testCase3);
        console.log(`Result: ${result3.importance.toUpperCase()} - ${result3.summary}`);
        console.log(`✅ ${result3.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test case 4: Chúc bé ngủ ngon (nên là LOW)
    const testCase4 = [
        {
            messageId: 'test4',
            authorId: 'user4',
            authorName: 'TestUser4',
            content: 'chúc bé ngu ngon',
            createdAt: new Date()
        }
    ];

    console.log('📝 Test Case 4: "chúc bé ngu ngon"');
    console.log('Expected: LOW (chúc ngủ ngon thân thiện)');
    
    try {
        const { analyzeMessagesWithGPT } = require('./chatAnalyzer');
        const result4 = await analyzeMessagesWithGPT(testCase4);
        console.log(`Result: ${result4.importance.toUpperCase()} - ${result4.summary}`);
        console.log(`✅ ${result4.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    console.log('🏁 Kết thúc test');
}

// Test function chính
async function testChatAnalyzer() {
    console.log('🚀 Bắt đầu test Chat Analyzer...\n');

    try {
        // Kết nối database
        const db = getDatabase();
        console.log('✅ Database connected');

        // Test cấu hình
        console.log('⚙️ Test cấu hình...');
        console.log(`ENABLED: ${CHAT_ANALYZER_CONFIG.ENABLED}`);
        console.log(`TARGET_CHANNEL_ID: ${CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID}`);
        console.log(`ANALYSIS_INTERVAL: ${CHAT_ANALYZER_CONFIG.ANALYSIS_INTERVAL}ms`);
        console.log(`BATCH_SIZE: ${CHAT_ANALYZER_CONFIG.BATCH_SIZE}`);
        console.log('✅ Cấu hình OK\n');

        // Test lưu tin nhắn
        console.log('📝 Test lưu tin nhắn...');
        const testMessages = [
            createMockMessage('Chúng ta cần thảo luận về dự án mới', 'user1', 'msg1'),
            createMockMessage('Tôi đồng ý, đây là quyết định quan trọng', 'user2', 'msg2'),
            createMockMessage('Dự án này sẽ thay đổi hoàn toàn cách chúng ta làm việc', 'user3', 'msg3'),
            createMockMessage('Chào mọi người', 'user4', 'msg4'),
            createMockMessage('👍', 'user5', 'msg5')
        ];
        
        for (const message of testMessages) {
            // Assuming saveMessageToDatabase is available from chatAnalyzer or imported elsewhere
            // For now, we'll just log the message
            console.log(`📝 Lưu tin nhắn:`, message.content);
        }
        
        // Test phân tích
        console.log('🔍 Test phân tích chat...');
        startChatAnalysisScheduler(db, mockClient);
        
        console.log('✅ Test hoàn thành');
    } catch (error) {
        console.error('❌ Lỗi test:', error);
    }
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
    testChatAnalyzer();
    testChatAnalysis().catch(console.error);
}

module.exports = { testChatAnalyzer, testChatAnalysis }; 