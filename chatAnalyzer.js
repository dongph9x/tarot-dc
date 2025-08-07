const { EmbedBuilder } = require('discord.js');
const { getChatGPTReading } = require('./chatgptReader');

// Cấu hình Chat Analyzer
const CHAT_ANALYZER_CONFIG = {
    TARGET_CHANNEL_ID: process.env.TARGET_CHANNEL_ID || null,
    ANALYSIS_INTERVAL: 1 * 30 * 1000, // 1 phút
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

    // Prompt mặc định - Tối ưu cho kiểm duyệt chat
    return `Bạn là chuyên gia kiểm duyệt nội dung chat tiếng Việt. Phân tích đoạn chat sau:

${messageTexts}

**QUY TẮC NGHIÊM NGẶT:**

**HIGH = Cần kiểm duyệt ngay lập tức**
**MEDIUM = Cần chú ý**
**LOW = Không cần kiểm duyệt**

**BẮT BUỘC ĐÁNH GIÁ HIGH KHI CÓ BẤT KỲ TỪ NÀO:**
- "mẹ", "mé", "mịa", "loz", "lz" (và các biến thể như "lozz", "lozzz", "lozzzz", "lzz", "lzzz")
- "đm", "dm", "đụ", "đéo", "đcm", "đít"
- "béo", "ngu", "đần", "ngốc", "dốt"
- "gay", "les", "bắc kỳ", "nam kỳ"

**QUAN TRỌNG:** Phải nhận diện các biến thể và từ viết tắt. Ví dụ: "lozzzz" = "loz", "ad" = "admin"

**VÍ DỤ BẮT BUỘC:**
- "Mé nhà nó chứ" → HIGH (có "mé")
- "Mẹ nhà nó chứ" → HIGH (có "mẹ") 
- "Đm mày ngu" → HIGH (có "đm" và "ngu")
- "loz admin" → HIGH (có "loz" và "admin")
- "lozz admin" → HIGH (có "lozz" và "admin")
- "lozzzz ad..." → HIGH (có "lozzzz" và "ad")
- "lz admin" → HIGH (có "lz" và "admin")
- "loz ad" → HIGH (có "loz" và "ad")
- "Chào mọi người" → LOW
- "Hello" → LOW

**TRẢ LỜI CHÍNH XÁC THEO FORMAT:**
IMPORTANCE: [LOW/MEDIUM/HIGH]
SUMMARY: [Lý do đánh giá ngắn gọn]`;
}

/**
 * Phân tích tin nhắn bằng GPT
 * @param {Array} messages - Danh sách tin nhắn
 * @returns {Object} Kết quả phân tích
 */
async function analyzeMessagesWithGPT(messages) {
    try {
        // Phân tích từng message riêng biệt
        const messageAnalysisResults = [];
        
        for (const message of messages) {
            const messageText = message.content.toLowerCase();
            
            // Danh sách từ cấm và biến thể
            const bannedWords = [
                'mẹ', 'mé', 'mịa', 'loz', 'lz', 'lozz', 'lozzz', 'lozzzz', 'lzz', 'lzzz',
                'đm', 'dm', 'đụ', 'đéo', 'đcm', 'đít',
                'béo', 'ngu', 'đần', 'ngốc', 'dốt',
                'gay', 'les', 'bắc kỳ', 'nam kỳ', 'anti'
            ];

            const foundBannedWords = bannedWords.filter(word => messageText.includes(word));
            
            if (foundBannedWords.length > 0) {
                messageAnalysisResults.push({
                    messageId: message.messageId,
                    authorId: message.authorId,
                    authorName: message.authorName,
                    content: message.content,
                    importance: IMPORTANCE_LEVELS.HIGH,
                    summary: `Phát hiện từ cấm: ${foundBannedWords.join(', ')}`,
                    bannedWords: foundBannedWords
                });
                console.log(`🔍 Message vi phạm: ${message.authorName} - "${message.content}" - Từ cấm: ${foundBannedWords.join(', ')}`);
            }
        }

        // Nếu có message vi phạm, trả về kết quả
        if (messageAnalysisResults.length > 0) {
            const allBannedWords = [...new Set(messageAnalysisResults.flatMap(result => result.bannedWords))];
            return {
                importance: IMPORTANCE_LEVELS.HIGH,
                summary: `Phát hiện từ cấm: ${allBannedWords.join(', ')}`,
                rawResponse: 'Phân tích trực tiếp',
                violatingMessages: messageAnalysisResults
            };
        }

        // Nếu không có vi phạm, thử phân tích bằng GPT
        const prompt = createAnalysisPrompt(messages);
        if (!prompt) {
            return { importance: IMPORTANCE_LEVELS.LOW, summary: 'Không có tin nhắn để phân tích' };
        }

        // Gọi OpenAI API trực tiếp cho chat analysis
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Bạn là một chuyên gia kiểm duyệt nội dung chat tiếng Việt. Bạn phân tích và đánh giá mức độ cần kiểm duyệt một cách chính xác và khách quan."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.3
        });

        const responseText = response.choices[0].message.content.trim();
        
        console.log(`🤖 GPT Response: ${responseText}`);
        
        // Parse response
        const lines = responseText.split('\n');
        let importance = IMPORTANCE_LEVELS.LOW;
        let summary = 'Không có gì đáng chú ý';

        for (const line of lines) {
            if (line.startsWith('IMPORTANCE:')) {
                const level = line.replace('IMPORTANCE:', '').trim().toLowerCase();
                console.log(`🔍 Parsed importance: "${level}"`);
                if (Object.values(IMPORTANCE_LEVELS).includes(level)) {
                    importance = level;
                }
            } else if (line.startsWith('SUMMARY:')) {
                summary = line.replace('SUMMARY:', '').trim();
                console.log(`🔍 Parsed summary: "${summary}"`);
            }
        }

        return { importance, summary, rawResponse: responseText };
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
        
        // Nếu có violatingMessages, chỉ lấy những message vi phạm
        const violatingMessages = analysisResult.violatingMessages || [];
        const messagesToLog = violatingMessages.length > 0 ? violatingMessages : messages;
        
        const importantLog = {
            summary: analysisResult.summary,
            messageIds: messagesToLog.map(msg => msg.messageId || msg.messageId),
            gptResponse: analysisResult.rawResponse || '',
            importanceLevel: analysisResult.importance,
            createdAt: new Date(),
            messageCount: messagesToLog.length,
            authors: [...new Set(messagesToLog.map(msg => msg.authorName || msg.authorName))],
            violatingMessages: violatingMessages // Lưu thông tin messages vi phạm
        };

        await collection.insertOne(importantLog);
        
        console.log(`🔍 Đã lưu phân tích quan trọng: ${analysisResult.importance.toUpperCase()} - ${analysisResult.summary.substring(0, 50)}...`);

        // Gửi thông báo nếu có đánh giá HIGH và có client
        if (analysisResult.importance === IMPORTANCE_LEVELS.HIGH && client) {
            await sendHighImportanceNotification(client, importantLog, db);
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
 * @param {Object} db - Database instance
 */
async function sendHighImportanceNotification(client, importantLog, db) {
    if (!CHAT_ANALYZER_CONFIG.NOTIFICATION_ENABLED || 
        CHAT_ANALYZER_CONFIG.NOTIFICATION_USER_IDS.length === 0) {
        return;
    }

    try {
        // Sử dụng violatingMessages nếu có,否则 lấy từ database
        let messagesToShow = [];
        if (importantLog.violatingMessages && importantLog.violatingMessages.length > 0) {
            messagesToShow = importantLog.violatingMessages;
        } else {
            // Lấy chi tiết tin nhắn từ database
            const messageCollection = db.collection(COLLECTIONS.MESSAGE_LOGS);
            messagesToShow = await messageCollection
                .find({ messageId: { $in: importantLog.messageIds } })
                .sort({ createdAt: 1 })
                .toArray();
        }

        // Tạo embed chi tiết với nội dung tin nhắn
        const embed = new EmbedBuilder()
            .setTitle(`🚨 THÔNG BÁO QUAN TRỌNG - ${importantLog.importanceLevel.toUpperCase()}`)
            .setDescription(importantLog.summary)
            .setColor('#FF0000') // Màu đỏ cho thông báo quan trọng
            .addFields(
                {
                    name: '📊 Thông Tin',
                    value: `**Số tin nhắn vi phạm:** ${messagesToShow.length}\n**Tác giả:** ${importantLog.authors.join(', ')}`,
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

        // Thêm nội dung tin nhắn vi phạm
        if (messagesToShow.length > 0) {
            const messageDetails = messagesToShow.map((msg, index) => {
                const timestamp = new Date(msg.createdAt || Date.now()).toLocaleTimeString('vi-VN');
                return `**${index + 1}. [${timestamp}] ${msg.authorName}:**\n${msg.content}`;
            }).join('\n\n');

            // Chia nhỏ nếu nội dung quá dài
            if (messageDetails.length > 1024) {
                const chunks = [];
                let currentChunk = '';
                const lines = messageDetails.split('\n');
                
                for (const line of lines) {
                    if ((currentChunk + line).length > 1024) {
                        if (currentChunk) chunks.push(currentChunk);
                        currentChunk = line;
                    } else {
                        currentChunk += (currentChunk ? '\n' : '') + line;
                    }
                }
                if (currentChunk) chunks.push(currentChunk);

                chunks.forEach((chunk, index) => {
                    embed.addFields({
                        name: index === 0 ? '💬 Nội Dung Tin Nhắn' : `💬 Nội Dung (Tiếp)`,
                        value: chunk,
                        inline: false
                    });
                });
            } else {
                embed.addFields({
                    name: '💬 Nội Dung Tin Nhắn',
                    value: messageDetails,
                    inline: false
                });
            }
        }

        // Gửi thông báo đến các user được cấu hình
        for (const userId of CHAT_ANALYZER_CONFIG.NOTIFICATION_USER_IDS) {
            try {
                const user = await client.users.fetch(userId);
                await user.send({ embeds: [embed] });
                console.log(`📤 Đã gửi thông báo chi tiết đến user: ${user.username} (${userId})`);
            } catch (error) {
                console.error(`❌ Không thể gửi thông báo đến user ${userId}:`, error.message);
            }
        }

        // Gửi cảnh báo trực tiếp đến channel nếu có
        await sendChannelWarning(client, importantLog, messagesToShow);
    } catch (error) {
        console.error('❌ Lỗi gửi thông báo:', error);
    }
}

/**
 * Gửi cảnh báo trực tiếp đến channel
 * @param {Object} client - Discord client
 * @param {Object} importantLog - Log quan trọng
 * @param {Array} messages - Danh sách tin nhắn
 */
async function sendChannelWarning(client, importantLog, messages) {
    try {
        const channelId = CHAT_ANALYZER_CONFIG.TARGET_CHANNEL_ID;
        if (!channelId) return;

        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error(`❌ Không tìm thấy channel: ${channelId}`);
            return;
        }

        // Tạo embed cảnh báo
        const warningEmbed = new EmbedBuilder()
            .setTitle(`⚠️ CẢNH BÁO - NỘI DUNG VI PHẠM`)
            .setDescription(`**Phát hiện nội dung vi phạm nghiêm trọng!**`)
            .setColor('#FF6B35') // Màu cam cảnh báo
            .addFields(
                {
                    name: '🚨 Mức Độ',
                    value: importantLog.importanceLevel.toUpperCase(),
                    inline: true
                },
                {
                    name: '👤 Tác Giả',
                    value: importantLog.authors.join(', '),
                    inline: true
                },
                {
                    name: '📝 Lý Do',
                    value: importantLog.summary,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Chat Analyzer • Tự động phát hiện' });

        // Thêm nội dung tin nhắn vi phạm
        if (messages.length > 0) {
            const messageDetails = messages.map((msg, index) => {
                const timestamp = new Date(msg.createdAt).toLocaleTimeString('vi-VN');
                return `**${index + 1}. [${timestamp}] ${msg.authorName}:**\n${msg.content}`;
            }).join('\n\n');

            if (messageDetails.length > 1024) {
                const chunks = [];
                let currentChunk = '';
                const lines = messageDetails.split('\n');
                
                for (const line of lines) {
                    if ((currentChunk + line).length > 1024) {
                        if (currentChunk) chunks.push(currentChunk);
                        currentChunk = line;
                    } else {
                        currentChunk += (currentChunk ? '\n' : '') + line;
                    }
                }
                if (currentChunk) chunks.push(currentChunk);

                chunks.forEach((chunk, index) => {
                    warningEmbed.addFields({
                        name: index === 0 ? '💬 Nội Dung Vi Phạm' : `💬 Nội Dung (Tiếp)`,
                        value: chunk,
                        inline: false
                    });
                });
            } else {
                warningEmbed.addFields({
                    name: '💬 Nội Dung Vi Phạm',
                    value: messageDetails,
                    inline: false
                });
            }
        }

        // Sử dụng violatingMessages nếu có,否则 sử dụng tất cả messages
        let messagesToProcess = messages;
        if (importantLog.violatingMessages && importantLog.violatingMessages.length > 0) {
            messagesToProcess = importantLog.violatingMessages;
        }

        // Tag chỉ những user vi phạm
        const violatingAuthors = [...new Set(messagesToProcess.map(msg => msg.authorName))];
        const authorMentions = violatingAuthors.map(author => {
            // Tìm user ID từ tên tác giả
            const message = messagesToProcess.find(msg => msg.authorName === author);
            return message ? `<@${message.authorId}>` : author;
        }).join(' ');

        // Tạo message cảnh báo
        const warningMessage = authorMentions ? 
            `⚠️ ${authorMentions} - Đoạn chat của bạn đã sử dụng từ vi phạm tiêu chuẩn cộng đồng!` : 
            '⚠️ Phát hiện sử dụng từ cấm!';

        // Reply vào từng tin nhắn vi phạm
        if (messagesToProcess.length > 0) {
            for (const violatingMessage of messagesToProcess) {
                try {
                    const messageToReply = await channel.messages.fetch(violatingMessage.messageId);
                    await messageToReply.reply({
                        content: `⚠️ <@${violatingMessage.authorId}> - Đoạn chat của bạn đã sử dụng từ vi phạm tiêu chuẩn cộng đồng!`
                    });
                } catch (error) {
                    // Nếu không thể reply (tin nhắn quá cũ), gửi tin nhắn mới
                    console.log(`⚠️ Không thể reply message ${violatingMessage.messageId}, gửi tin nhắn mới: ${error.message}`);
                    await channel.send({
                        content: `⚠️ <@${violatingMessage.authorId}> - Đoạn chat của bạn đã sử dụng từ vi phạm tiêu chuẩn cộng đồng!`
                    });
                }
            }
        } else {
            // Fallback nếu không có tin nhắn
            await channel.send({
                content: warningMessage
            });
        }

        console.log(`⚠️ Đã gửi cảnh báo đến channel: ${channel.name} (${channelId})`);

    } catch (error) {
        console.error('❌ Lỗi gửi cảnh báo channel:', error);
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