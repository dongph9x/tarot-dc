// Simple test để kiểm tra emoji handling
require('dotenv').config();
const { analyzeMessagesWithGPT, IMPORTANCE_LEVELS } = require('./chatAnalyzer');

async function testEmojiHandling() {
    console.log('🧪 Test Emoji Handling...\n');

    // Test emoji-only message
    const emojiTest = [
        {
            messageId: 'emoji1',
            authorId: 'user1',
            authorName: 'TestUser',
            content: ':AniNhi~17:',
            createdAt: new Date()
        }
    ];

    console.log('📝 Testing emoji-only message: ":AniNhi~17:"');
    console.log('Expected: LOW (should be ignored as emoji-only)');
    
    try {
        const result = await analyzeMessagesWithGPT(emojiTest);
        console.log(`Result: ${result.importance.toUpperCase()} - ${result.summary}`);
        console.log(`✅ ${result.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test emoji with text
    const emojiWithTextTest = [
        {
            messageId: 'emoji2',
            authorId: 'user2',
            authorName: 'TestUser',
            content: '👍 Hello there',
            createdAt: new Date()
        }
    ];

    console.log('📝 Testing emoji with text: "👍 Hello there"');
    console.log('Expected: LOW (emoji + normal text)');
    
    try {
        const result = await analyzeMessagesWithGPT(emojiWithTextTest);
        console.log(`Result: ${result.importance.toUpperCase()} - ${result.summary}`);
        console.log(`✅ ${result.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test multiple emojis
    const multipleEmojisTest = [
        {
            messageId: 'emoji3',
            authorId: 'user3',
            authorName: 'TestUser',
            content: '😀😍🎉',
            createdAt: new Date()
        }
    ];

    console.log('📝 Testing multiple emojis: "😀😍🎉"');
    console.log('Expected: LOW (only emojis)');
    
    try {
        const result = await analyzeMessagesWithGPT(multipleEmojisTest);
        console.log(`Result: ${result.importance.toUpperCase()} - ${result.summary}`);
        console.log(`✅ ${result.importance === IMPORTANCE_LEVELS.LOW ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    console.log('🏁 Emoji test completed!');
}

// Run the test
testEmojiHandling().catch(console.error); 