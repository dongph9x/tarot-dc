const { EmbedBuilder } = require('discord.js');
const { getChatAnalyzerStats, createImportantAnalysisEmbed, CHAT_ANALYZER_CONFIG } = require('./chatAnalyzer');

// Commands cho Chat Analyzer
const CHAT_ANALYZER_COMMANDS = {
    'analyzer': 'Xem thống kê Chat Analyzer',
    'analyzerhelp': 'Hướng dẫn sử dụng Chat Analyzer',
    'analyzerstatus': 'Kiểm tra trạng thái Chat Analyzer'
};

/**
 * Tạo embed thống kê Chat Analyzer
 * @param {Object} stats - Thống kê từ database
 * @returns {EmbedBuilder}
 */
function createAnalyzerStatsEmbed(stats) {
    const embed = new EmbedBuilder()
        .setTitle('🔍 Thống Kê Chat Analyzer')
        .setColor('#00CED1')
        .setDescription('Thống kê hoạt động của hệ thống phân tích chat')
        .addFields(
            {
                name: '📊 Tổng Quan',
                value: `**Tổng tin nhắn:** ${stats.totalMessages}\n**Tin nhắn hôm nay:** ${stats.todayMessages}\n**Đang chờ xử lý:** ${stats.pendingMessages}`,
                inline: true
            },
            {
                name: '🔍 Phân Tích',
                value: `**Log quan trọng:** ${stats.importantLogs}\n**Trạng thái:** ${stats.enabled ? '✅ Bật' : '❌ Tắt'}\n**Channel:** ${stats.targetChannel || 'Chưa cấu hình'}`,
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({ text: 'Chat Analyzer • Tự động phân tích mỗi 2 phút' });

    return embed;
}

/**
 * Tạo embed help cho Chat Analyzer
 * @returns {EmbedBuilder}
 */
function createAnalyzerHelpEmbed() {
    return new EmbedBuilder()
        .setTitle('🔍 Hướng Dẫn Chat Analyzer')
        .setColor('#FFD700')
        .setDescription('Hệ thống tự động phân tích và lưu trữ nội dung chat quan trọng')
        .addFields(
            {
                name: '🎯 Chức Năng',
                value: `
                • **Theo dõi chat**: Tự động lưu tin nhắn từ channel được chỉ định
                • **Phân tích AI**: GPT phân tích nội dung mỗi 2 phút
                • **Lưu trữ**: Tự động lưu nội dung quan trọng
                • **Thông báo**: Embed cho nội dung quan trọng
                `,
                inline: false
            },
            {
                name: '📋 Các Lệnh',
                value: `
                • \`!analyzer\` - Xem thống kê Chat Analyzer
                • \`!analyzerhelp\` - Hiển thị hướng dẫn này
                • \`!analyzerstatus\` - Kiểm tra trạng thái hệ thống
                `,
                inline: false
            },
            {
                name: '🔧 Cấu Hình',
                value: `
                • **TARGET_CHANNEL_ID**: Channel cần theo dõi
                • **CHAT_ANALYZER_ENABLED**: Bật/tắt hệ thống (true/false)
                • **ANALYSIS_INTERVAL**: Chu kỳ phân tích (mặc định: 2 phút)
                `,
                inline: false
            },
            {
                name: '📊 Mức Độ Quan Trọng',
                value: `
                • **HIGH**: Dự án, quyết định, khủng hoảng
                • **MEDIUM**: Kỹ thuật, tư vấn, cập nhật
                • **LOW**: Chào hỏi, chuyện phiếm, spam
                `,
                inline: false
            },
            {
                name: '⚠️ Lưu Ý',
                value: 'Hệ thống chỉ phân tích tin nhắn text, bỏ qua bot messages và tin nhắn rỗng.',
                inline: false
            }
        )
        .setTimestamp();
}

/**
 * Tạo embed trạng thái Chat Analyzer
 * @param {Object} stats - Thống kê từ database
 * @returns {EmbedBuilder}
 */
function createAnalyzerStatusEmbed(stats) {
    const statusColor = stats.enabled ? '#00FF00' : '#FF0000';
    const statusText = stats.enabled ? '✅ Đang Hoạt Động' : '❌ Đã Tắt';
    
    const embed = new EmbedBuilder()
        .setTitle('🔍 Trạng Thái Chat Analyzer')
        .setColor(statusColor)
        .setDescription(statusText)
        .addFields(
            {
                name: '⚙️ Cấu Hình',
                value: `**Bật/Tắt:** ${stats.enabled ? 'Bật' : 'Tắt'}\n**Channel:** ${stats.targetChannel || 'Chưa cấu hình'}\n**Chu kỳ:** 2 phút`,
                inline: true
            },
            {
                name: '📈 Hoạt Động',
                value: `**Tin nhắn hôm nay:** ${stats.todayMessages}\n**Đang chờ:** ${stats.pendingMessages}\n**Log quan trọng:** ${stats.importantLogs}`,
                inline: true
            }
        )
        .setTimestamp();

    if (!stats.enabled) {
        embed.addFields({
            name: '💡 Cách Bật',
            value: 'Thêm vào file .env:\n`CHAT_ANALYZER_ENABLED=true`\n`TARGET_CHANNEL_ID=your_channel_id`',
            inline: false
        });
    }

    return embed;
}

/**
 * Xử lý commands Chat Analyzer
 * @param {Object} message - Discord message
 * @param {string} commandName - Tên command
 * @param {Object} db - Database instance
 * @returns {Promise<EmbedBuilder>}
 */
async function handleChatAnalyzerCommand(message, commandName, db) {
    try {
        switch (commandName) {
            case 'analyzer': {
                const stats = await getChatAnalyzerStats(db);
                return createAnalyzerStatsEmbed(stats);
            }

            case 'analyzerhelp': {
                return createAnalyzerHelpEmbed();
            }

            case 'analyzerstatus': {
                const stats = await getChatAnalyzerStats(db);
                return createAnalyzerStatusEmbed(stats);
            }

            default:
                return null;
        }
    } catch (error) {
        console.error('❌ Lỗi xử lý Chat Analyzer command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Lỗi Chat Analyzer')
            .setDescription('Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.')
            .setColor('#FF0000')
            .setTimestamp();
        
        return errorEmbed;
    }
}

/**
 * Kiểm tra xem command có phải Chat Analyzer command không
 * @param {string} commandName - Tên command
 * @returns {boolean}
 */
function isChatAnalyzerCommand(commandName) {
    return Object.keys(CHAT_ANALYZER_COMMANDS).includes(commandName);
}

/**
 * Lấy danh sách commands Chat Analyzer
 * @returns {Object}
 */
function getChatAnalyzerCommands() {
    return CHAT_ANALYZER_COMMANDS;
}

module.exports = {
    handleChatAnalyzerCommand,
    isChatAnalyzerCommand,
    getChatAnalyzerCommands,
    createAnalyzerStatsEmbed,
    createAnalyzerHelpEmbed,
    createAnalyzerStatusEmbed
}; 