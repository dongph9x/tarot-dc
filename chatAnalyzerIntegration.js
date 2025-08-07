// Chat Analyzer Integration - Thêm vào bot hiện tại
const { saveMessageToDatabase, startChatAnalysisScheduler } = require('./chatAnalyzer');
const { handleChatAnalyzerCommand, isChatAnalyzerCommand, getChatAnalyzerCommands } = require('./chatAnalyzerCommands');

/**
 * Khởi tạo Chat Analyzer
 * @param {Object} client - Discord client
 * @param {Object} db - Database instance
 */
function initializeChatAnalyzer(client, db) {
    // Khởi động scheduler với client
    startChatAnalysisScheduler(db, client);
    
    // Thêm event listener cho tin nhắn mới
    client.on('messageCreate', async (message) => {
        try {
            await saveMessageToDatabase(db, message);
        } catch (error) {
            console.error('❌ Lỗi lưu tin nhắn Chat Analyzer:', error);
        }
    });
    
    console.log('🔍 Chat Analyzer đã được khởi tạo');
}

/**
 * Xử lý Chat Analyzer commands
 * @param {Object} message - Discord message
 * @param {string} commandName - Tên command
 * @param {Object} db - Database instance
 * @returns {Promise<boolean>} True nếu đã xử lý
 */
async function processChatAnalyzerCommands(message, commandName, db) {
    if (!isChatAnalyzerCommand(commandName)) {
        return false;
    }
    
    try {
        const embed = await handleChatAnalyzerCommand(message, commandName, db);
        if (embed) {
            await message.reply({ embeds: [embed] });
            return true;
        }
    } catch (error) {
        console.error('❌ Lỗi xử lý Chat Analyzer command:', error);
    }
    
    return false;
}

/**
 * Lấy danh sách commands Chat Analyzer
 * @returns {Object}
 */
function getChatAnalyzerCommandsList() {
    return getChatAnalyzerCommands();
}

module.exports = {
    initializeChatAnalyzer,
    processChatAnalyzerCommands,
    getChatAnalyzerCommandsList
}; 