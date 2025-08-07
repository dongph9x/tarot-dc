const { EmbedBuilder } = require('discord.js');
const { getChatGPTReading } = require('./chatgptReader');

// Cấu hình Chat Analyzer
const CHAT_ANALYZER_CONFIG = {
    TARGET_CHANNEL_ID: process.env.TARGET_CHANNEL_ID || null,
    ANALYSIS_INTERVAL: 2 * 60 * 1000, // 2 phút
    BATCH_SIZE: 10, // Số tin nhắn xử lý mỗi lần
    ENABLED: process.env.CHAT_ANALYZER_ENABLED === 'true',
    CUSTOM_PROMPT: process.env.CHAT_ANALYZER_PROMPT || null,
    NOTIFICATION_ENABLED: process.env.NOTIFICATION_ENABLED === 'true',
    NOTIFICATION_USER_IDS: process.env.NOTIFICATION_USER_IDS ? 
        process.env.NOTIFICATION_USER_IDS.split(',').map(id => id.trim()) : []
};

// MongoDB Collections
const COLLECTIONS = {
    MESSAGE_LOGS: 'message_logs',
    IMPORTANT_LOGS: 'important_logs'
};

// Trạng thái xử lý
const PROCESSING_STATUS = {
    PENDING: 'pending',
    DONE: 'done',
    ERROR: 'error'
};

// Mức độ quan trọng
const IMPORTANCE_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

/**
 * Lưu tin nhắn vào database
 * @param {Object} db - Database instance
 * @param {Object} message - Discord message object
 */
async function saveMessageToDatabase(db, message) {
    if (!CHAT_ANALYZER_CONFIG.ENABLED || !CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID) {
        return;
    }

    // Chỉ xử lý tin nhắn từ channel được chỉ định
    if (message.channelId !== CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID) {
        return;
    }

    // Chỉ xử lý tin nhắn text, bỏ qua bot messages
    if (message.author.bot || !message.content || message.content.trim() === '') {
        return;
    }

    try {
        const collection = db.collection(COLLECTIONS.MESSAGE_LOGS);
        
        const messageData = {
            messageId: message.id,
            authorId: message.author.id,
            authorName: message.author.username,
            content: message.content,
            channelId: message.channelId,
            createdAt: message.createdAt,
            status: PROCESSING_STATUS.PENDING,
            processedAt: null
        };

        // Upsert để tránh duplicate
        await collection.updateOne(
            { messageId: message.id },
            { $set: messageData },
            { upsert: true }
        );

        console.log(`📝 Đã lưu tin nhắn: ${message.author.username} - ${message.content.substring(0, 50)}...`);
    } catch (error) {
        console.error('❌ Lỗi lưu tin nhắn:', error);
    }
}

/**
 * Lấy tin nhắn chưa xử lý từ database
 * @param {Object} db - Database instance
 * @returns {Array} Danh sách tin nhắn
 */
async function getPendingMessages(db) {
    try {
        const collection = db.collection(COLLECTIONS.MESSAGE_LOGS);
        
        const pendingMessages = await collection
            .find({ status: PROCESSING_STATUS.PENDING })
            .sort({ createdAt: 1 })
            .limit(CHAT_ANALYZER_CONFIG.BATCH_SIZE)
            .toArray();

        return pendingMessages;
    } catch (error) {
        console.error('❌ Lỗi lấy tin nhắn pending:', error);
        return [];
    }
}

/**
 * Tạo prompt cho GPT từ danh sách tin nhắn
 * @param {Array} messages - Danh sách tin nhắn
 * @returns {string} Prompt
 */
function createAnalysisPrompt(messages) {
    if (messages.length === 0) {
        return '';
    }

    const messageTexts = messages.map(msg => {
        const timestamp = new Date(msg.createdAt).toLocaleTimeString('vi-VN');
        return `[${timestamp}] ${msg.authorName}: ${msg.content}`;
    }).join('\n');

    // Sử dụng prompt tùy chỉnh nếu có,否则 sử dụng prompt mặc định
    if (CHAT_ANALYZER_CONFIG.CUSTOM_PROMPT) {
        return `${CHAT_ANALYZER_CONFIG.CUSTOM_PROMPT}

${messageTexts}

**Trả lời theo format chính xác:**
IMPORTANCE: [LOW/MEDIUM/HIGH]
SUMMARY: [Tóm tắt ngắn gọn nội dung quan trọng, hoặc "Không có gì đáng chú ý"]`;
    }

    // Prompt mặc định
    return `Phân tích đoạn chat sau và đánh giá mức độ quan trọng:

${messageTexts}

**HƯỚNG DẪN PHÂN TÍCH:**

**HIGH (Quan trọng cao):**
Những trường hợp dới dây sẽ thuộc HIGH:
- Nhắc đến ai đó có tên: Nhi, Đông, NoTwo
- Nhắc đến vai trò: Mod, Admin...
- Dùng những từ nóng như: đù, wtf, căng, mẹ, mịa, chửi...
- Dùng những từ mang cảm xúc như: yêu, ghét, thích, thương, lỗi, tội lỗi...
- Dùng những từ mang tính chât phân biệt: gay, less, lẩu gà bình thuận, lgbt, parky, bắc kì, nam kì...
- Dùng những từ mang tính chất châm biếm, xúc phạm nghiêm trọng: béo như heo, ăn như lợn...

**MEDIUM (Quan trọng trung bình):**
- Hỏi đáp, tư vấn, góp ý về công việc, cuộc sống
- Từ liên quan trạng thái: Block, ban....

**LOW (Không quan trọng):**
- Chào hỏi, chuyện phiếm, spam
- Emoji, reaction, tin nhắn ngắn
- Chia sẻ meme, video giải trí

**VÍ DỤ PHÂN TÍCH:**
- "a Đông, ah Đông, anh Đông" → HIGH
- "chị Nhi, c Nhi, ch Nhi, chi Nhi" → HIGH  
- "Mod, Admin" → HIGH
- "Yêu, ghét, chửi, xin lỗi" → HIGH
- "Căng, đù, wtf, dm, mẹ, mịa..." → HIGH
- "Ban, Block" → MEDIUM
- "Chào mọi người, mọi người ăn chưa, mọi người có khỏe không..." → MEDIUM
- "Hello, đi làm, ăn cơm...." → LOW
- "👍" → LOW

**Trả lời theo format chính xác:**
IMPORTANCE: [LOW/MEDIUM/HIGH]
SUMMARY: [Tóm tắt ngắn gọn nội dung quan trọng, hoặc "Không có gì đáng chú ý"]`;
}

/**
 * Phân tích tin nhắn bằng GPT
 * @param {Array} messages - Danh sách tin nhắn
 * @returns {Object} Kết quả phân tích
 */
async function analyzeMessagesWithGPT(messages) {
    try {
        const prompt = createAnalysisPrompt(messages);
        if (!prompt) {
            return { importance: IMPORTANCE_LEVELS.LOW, summary: 'Không có tin nhắn để phân tích' };
        }

        const response = await getChatGPTReading('custom', [], prompt);
        
        // Parse response
        const lines = response.split('\n');
        let importance = IMPORTANCE_LEVELS.LOW;
        let summary = 'Không có gì đáng chú ý';

        for (const line of lines) {
            if (line.startsWith('IMPORTANCE:')) {
                const level = line.replace('IMPORTANCE:', '').trim().toLowerCase();
                if (Object.values(IMPORTANCE_LEVELS).includes(level)) {
                    importance = level;
                }
            } else if (line.startsWith('SUMMARY:')) {
                summary = line.replace('SUMMARY:', '').trim();
            }
        }

        return { importance, summary, rawResponse: response };
    } catch (error) {
        console.error('❌ Lỗi phân tích GPT:', error);
        return { importance: IMPORTANCE_LEVELS.LOW, summary: 'Lỗi phân tích' };
    }
}

/**
 * Lưu kết quả phân tích quan trọng
 * @param {Object} db - Database instance
 * @param {Object} analysisResult - Kết quả phân tích
 * @param {Array} messages - Danh sách tin nhắn
 * @param {Object} client - Discord client (optional)
 */
async function saveImportantAnalysis(db, analysisResult, messages, client = null) {
    try {
        const collection = db.collection(COLLECTIONS.IMPORTANT_LOGS);
        
        const importantLog = {
            summary: analysisResult.summary,
            messageIds: messages.map(msg => msg.messageId),
            gptResponse: analysisResult.rawResponse || '',
            importanceLevel: analysisResult.importance,
            createdAt: new Date(),
            messageCount: messages.length,
            authors: [...new Set(messages.map(msg => msg.authorName))]
        };

        await collection.insertOne(importantLog);
        
        console.log(`🔍 Đã lưu phân tích quan trọng: ${analysisResult.importance.toUpperCase()} - ${analysisResult.summary.substring(0, 50)}...`);

        // Gửi thông báo nếu có đánh giá HIGH và có client
        if (analysisResult.importance === IMPORTANCE_LEVELS.HIGH && client) {
            await sendHighImportanceNotification(client, importantLog);
        }
    } catch (error) {
        console.error('❌ Lỗi lưu phân tích quan trọng:', error);
    }
}

/**
 * Cập nhật trạng thái tin nhắn đã xử lý
 * @param {Object} db - Database instance
 * @param {Array} messageIds - Danh sách message IDs
 * @param {string} status - Trạng thái mới
 */
async function updateMessageStatus(db, messageIds, status) {
    try {
        const collection = db.collection(COLLECTIONS.MESSAGE_LOGS);
        
        await collection.updateMany(
            { messageId: { $in: messageIds } },
            { 
                $set: { 
                    status: status,
                    processedAt: new Date()
                }
            }
        );

        console.log(`✅ Đã cập nhật trạng thái ${messageIds.length} tin nhắn: ${status}`);
    } catch (error) {
        console.error('❌ Lỗi cập nhật trạng thái tin nhắn:', error);
    }
}

/**
 * Xử lý phân tích định kỳ
 * @param {Object} db - Database instance
 * @param {Object} client - Discord client (optional)
 */
async function processChatAnalysis(db, client = null) {
    if (!CHAT_ANALYZER_CONFIG.ENABLED) {
        return;
    }

    try {
        console.log('🔍 Bắt đầu phân tích chat...');
        
        // Lấy tin nhắn chưa xử lý
        const pendingMessages = await getPendingMessages(db);
        
        if (pendingMessages.length === 0) {
            console.log('📭 Không có tin nhắn nào cần phân tích');
            return;
        }

        console.log(`📋 Tìm thấy ${pendingMessages.length} tin nhắn cần phân tích`);

        // Phân tích bằng GPT
        const analysisResult = await analyzeMessagesWithGPT(pendingMessages);
        
        console.log(`🔍 Kết quả phân tích: ${analysisResult.importance.toUpperCase()} - ${analysisResult.summary}`);
        
        // Cập nhật trạng thái tin nhắn
        await updateMessageStatus(db, pendingMessages.map(msg => msg.messageId), PROCESSING_STATUS.DONE);

        // Nếu có nội dung quan trọng, lưu vào important_logs
        if (analysisResult.importance !== IMPORTANCE_LEVELS.LOW || 
            !analysisResult.summary.includes('Không có gì đáng chú ý')) {
            console.log(`💾 Lưu vào important_logs: ${analysisResult.importance.toUpperCase()}`);
            await saveImportantAnalysis(db, analysisResult, pendingMessages, client);
        } else {
            console.log(`📝 Không lưu vào important_logs: ${analysisResult.importance.toUpperCase()} - ${analysisResult.summary}`);
        }

        console.log('✅ Hoàn thành phân tích chat');
    } catch (error) {
        console.error('❌ Lỗi xử lý phân tích chat:', error);
        
        // Cập nhật trạng thái lỗi nếu có
        if (pendingMessages && pendingMessages.length > 0) {
            await updateMessageStatus(db, pendingMessages.map(msg => msg.messageId), PROCESSING_STATUS.ERROR);
        }
    }
}

/**
 * Tạo embed thông báo phân tích quan trọng
 * @param {Object} importantLog - Log quan trọng
 * @returns {EmbedBuilder}
 */
function createImportantAnalysisEmbed(importantLog) {
    const colors = {
        [IMPORTANCE_LEVELS.LOW]: '#00FF00',
        [IMPORTANCE_LEVELS.MEDIUM]: '#FFA500',
        [IMPORTANCE_LEVELS.HIGH]: '#FF0000'
    };

    const embed = new EmbedBuilder()
        .setTitle(`🔍 Phân Tích Chat Quan Trọng - ${importantLog.importanceLevel.toUpperCase()}`)
        .setDescription(importantLog.summary)
        .setColor(colors[importantLog.importanceLevel] || '#00FF00')
        .addFields(
            {
                name: '📊 Thông Tin',
                value: `**Số tin nhắn:** ${importantLog.messageCount}\n**Tác giả:** ${importantLog.authors.join(', ')}`,
                inline: true
            },
            {
                name: '⏰ Thời Gian',
                value: new Date(importantLog.createdAt).toLocaleString('vi-VN'),
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({ text: 'Chat Analyzer • Tự động phân tích' });

    return embed;
}

/**
 * Khởi tạo scheduler cho phân tích định kỳ
 * @param {Object} db - Database instance
 * @param {Object} client - Discord client
 */
function startChatAnalysisScheduler(db, client) {
    if (!CHAT_ANALYZER_CONFIG.ENABLED) {
        console.log('⚠️ Chat Analyzer đã bị tắt');
        return;
    }

    if (!CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID) {
        console.log('⚠️ Chưa cấu hình TARGET_CHANNEL_ID cho Chat Analyzer');
        return;
    }

    console.log('🚀 Khởi động Chat Analyzer Scheduler...');
    console.log(`📺 Theo dõi channel: ${CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID}`);
    console.log(`⏰ Chu kỳ phân tích: ${CHAT_ANALYZER_CONFIG.ANALYSIS_INTERVAL / 1000} giây`);

    // Chạy phân tích ngay lập tức
    processChatAnalysis(db, client);

    // Lập lịch phân tích định kỳ
    setInterval(() => {
        processChatAnalysis(db, client);
    }, CHAT_ANALYZER_CONFIG.ANALYSIS_INTERVAL);
}

/**
 * Gửi thông báo đến user khi có đánh giá HIGH
 * @param {Object} client - Discord client
 * @param {Object} importantLog - Log quan trọng
 */
async function sendHighImportanceNotification(client, importantLog) {
    if (!CHAT_ANALYZER_CONFIG.NOTIFICATION_ENABLED || 
        CHAT_ANALYZER_CONFIG.NOTIFICATION_USER_IDS.length === 0) {
        return;
    }

    try {
        const embed = createImportantAnalysisEmbed(importantLog);
        embed.setTitle(`🚨 THÔNG BÁO QUAN TRỌNG - ${importantLog.importanceLevel.toUpperCase()}`);
        embed.setColor('#FF0000'); // Màu đỏ cho thông báo quan trọng

        for (const userId of CHAT_ANALYZER_CONFIG.NOTIFICATION_USER_IDS) {
            try {
                const user = await client.users.fetch(userId);
                await user.send({ embeds: [embed] });
                console.log(`📤 Đã gửi thông báo đến user: ${user.username} (${userId})`);
            } catch (error) {
                console.error(`❌ Không thể gửi thông báo đến user ${userId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Lỗi gửi thông báo:', error);
    }
}

/**
 * Lấy thống kê chat analyzer
 * @param {Object} db - Database instance
 * @returns {Promise<Object>} Thống kê
 */
async function getChatAnalyzerStats(db) {
    try {
        const messageCollection = db.collection(COLLECTIONS.MESSAGE_LOGS);
        const importantCollection = db.collection(COLLECTIONS.IMPORTANT_LOGS);

        const [
            totalMessages,
            pendingMessages,
            importantLogs,
            todayMessages
        ] = await Promise.all([
            messageCollection.countDocuments(),
            messageCollection.countDocuments({ status: PROCESSING_STATUS.PENDING }),
            importantCollection.countDocuments(),
            messageCollection.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            })
        ]);

        return {
            totalMessages,
            pendingMessages,
            importantLogs,
            todayMessages,
            enabled: CHAT_ANALYZER_CONFIG.ENABLED,
            targetChannel: CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID
        };
    } catch (error) {
        console.error('❌ Lỗi lấy thống kê chat analyzer:', error);
        return {
            totalMessages: 0,
            pendingMessages: 0,
            importantLogs: 0,
            todayMessages: 0,
            enabled: false,
            targetChannel: null
        };
    }
}

module.exports = {
    saveMessageToDatabase,
    startChatAnalysisScheduler,
    getChatAnalyzerStats,
    createImportantAnalysisEmbed,
    sendHighImportanceNotification,
    CHAT_ANALYZER_CONFIG,
    COLLECTIONS,
    PROCESSING_STATUS,
    IMPORTANCE_LEVELS
}; 