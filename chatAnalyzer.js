const { EmbedBuilder } = require('discord.js');
const { getChatGPTReading } = require('./chatgptReader');

// Cấu hình Chat Analyzer
const CHAT_ANALYZER_CONFIG = {
    TARGET_CHANNEL_ID: process.env.TARGET_CHANNEL_ID || null,
    ANALYSIS_INTERVAL: 1 * 10 * 1000, // 1 phút
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

    // Prompt mặc định - Tối ưu cho kiểm duyệt chat với AI Context Analysis
    return `Bạn là chuyên gia kiểm duyệt nội dung chat tiếng Việt. Phân tích đoạn chat sau:

${messageTexts}

**QUY TẮC NGHIÊM NGẶT:**

**HIGH = Cần kiểm duyệt ngay lập tức (chửi thề, xúc phạm)**
**MEDIUM = Cần chú ý (có thể có ý xấu)**
**LOW = Không cần kiểm duyệt (bình thường)**

**PHÂN TÍCH NGỮ CẢNH QUAN TRỌNG:**

**TỪ CẤM NHƯNG CÓ THỂ HỢP LỆ TRONG NGỮ CẢNH:**
- "mẹ", "mé", "mịa" → Chỉ HIGH khi dùng để chửi, không HIGH khi gọi mẹ bình thường
- "ngu", "đần", "ngốc", "dốt" → Chỉ HIGH khi dùng để xúc phạm người khác
- "béo", "mập", "gầy" → Chỉ HIGH khi dùng để chế giễu người khác, không HIGH khi nói về cân nặng bản thân
- "anti" → Chỉ HIGH khi dùng để chống đối người khác, không HIGH khi nói về phần mềm/khái niệm

**QUY TẮC ĐÁNH GIÁ XÚC PHẠM:**
- Gọi tên người + từ chế giễu = HIGH (ví dụ: "đông béo", "nhi béo", "nam béo", "dong béo")
- Thêm "thằng" + tên + từ chế giễu = HIGH (ví dụ: "thằng đông béo", "thằng nhi béo", "thằng nam béo")
- Nói về bản thân + từ mô tả = LOW (ví dụ: "tôi béo quá", "tôi mập quá")

**QUY TẮC ĐẶC BIỆT CHO TỪ "NGU":**
- Pattern chúc ngủ ngon = LOW (ví dụ: "chúc bạn ngủ ngon", "chuc ban ngu ngon", "ngủ ngon nha")
- Pattern xúc phạm với "ngu" = HIGH (ví dụ: "mày ngu", "thằng đông ngu", "đông ngu")

**QUAN TRỌNG:** Bất kỳ tên người nào + từ chế giễu ngoại hình đều là HIGH!

**VÍ DỤ PHÂN BIỆT:**

**✅ HIGH (chửi thề/xúc phạm):**
- "Mé nhà nó chứ" → HIGH (chửi thề)
- "Mẹ nhà nó chứ" → HIGH (chửi thề)
- "Đm mày ngu" → HIGH (chửi thề + xúc phạm)
- "loz admin" → HIGH (chửi thề)
- "Mày ngu quá" → HIGH (xúc phạm)
- "Béo như heo" → HIGH (chế giễu)
- "đông béo" → HIGH (gọi tên + chế giễu ngoại hình)
- "thằng đông béo" → HIGH (xúc phạm + chế giễu ngoại hình)
- "nhi béo" → HIGH (gọi tên + chế giễu ngoại hình)
- "thằng nhi béo" → HIGH (xúc phạm + chế giễu ngoại hình)
- "nam béo" → HIGH (gọi tên + chế giễu ngoại hình)
- "thằng nam béo" → HIGH (xúc phạm + chế giễu ngoại hình)
- "anti admin" → HIGH (chống đối admin)
- "anti nhi" → HIGH (chống đối người khác)

**✅ LOW (bình thường):**
- "Mẹ tôi đang nấu cơm" → LOW (gọi mẹ bình thường)
- "Mẹ ơi, con về rồi" → LOW (gọi mẹ bình thường)
- "Tôi béo quá" → LOW (nói về cân nặng bản thân)
- "Tôi mập quá" → LOW (nói về cân nặng bản thân)
- "Tôi gầy quá" → LOW (nói về cân nặng bản thân)
- "anti virus" → LOW (phần mềm diệt virus)
- "anti aging" → LOW (chống lão hóa)
- "Chào mọi người" → LOW
- "Hello" → LOW
- "Chuc ban ngu ngon" → LOW (chúc ngủ ngon thân thiện)
- "Chúc bạn ngủ ngon" → LOW (chúc ngủ ngon thân thiện)
- "Chúc bé ngu ngon" → LOW (chúc ngủ ngon thân thiện)
- "Chúc con ngu ngon" → LOW (chúc ngủ ngon thân thiện)
- "Ngủ ngon nha" → LOW (chúc ngủ ngon thân thiện)
- "Good night" → LOW (chúc ngủ ngon thân thiện)
- "GN" → LOW (chúc ngủ ngon thân thiện)

**QUAN TRỌNG:** 
1. Phải phân tích ngữ cảnh, không chỉ dựa vào từ đơn lẻ!
2. Bất kỳ tên người nào + từ chế giễu ngoại hình = HIGH!
3. Thêm "thằng" + tên + từ chế giễu = HIGH (xúc phạm nghiêm trọng)!
4. Chỉ LOW khi nói về bản thân (tôi, mình, ta) + từ mô tả!

**BẮT BUỘC ĐÁNH GIÁ HIGH KHI:**
- Có từ "thằng" + tên người + từ chế giễu
- Có tên người + từ chế giễu ngoại hình
- Có từ chửi thề rõ ràng

**BẮT BUỘC ĐÁNH GIÁ LOW KHI:**
- Có pattern chúc ngủ ngon với từ "ngu" (ví dụ: "chúc bạn ngủ ngon", "chuc ban ngu ngon")

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
            
            // Chuẩn hóa text (loại bỏ dấu, ký tự đặc biệt)
            const normalizedText = messageText
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
                .replace(/[^a-z0-9\s]/g, '') // Chỉ giữ chữ cái, số, khoảng trắng
                .replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng
            
            // Danh sách từ cấm gốc
            const baseBannedWords = [
                // Chửi thề cơ bản - LUÔN vi phạm
                'me', 'loz', 'lz', 'dm', 'deo', 'dcm',
                'lozz', 'lozzz', 'lozzzz', 'lzz', 'lzzz', 'lzzzz',
                'dcm', 'dcl', 'dcmn', 'dclm',
                // Chửi về vùng miền - LUÔN vi phạm
                'bac ky', 'nam ky'
            ];
            
            // Danh sách từ cấm có dấu (chỉ những từ LUÔN vi phạm - chửi thề rõ ràng)
            const accentedBannedWords = [
                // Chửi thề cơ bản - LUÔN vi phạm
                'mé', 'mịa', 'đm', 'đụ', 'đéo', 'đcm', 'đít', 'địt', 'đụt', 'đụm',
                'đcm', 'đcl', 'đcmn', 'đclm', 'đcmđ', 'đclđ',
                'đụ', 'đụt', 'đụm', 'đụn', 'đụp', 'đụq',
                'đéo', 'đéo', 'đéo', 'đéo', 'đéo',
                'đít', 'địt', 'đít', 'địt', 'đít', 'lồn',
                // Chửi về vùng miền - LUÔN vi phạm
                'bắc kỳ', 'nam kỳ', 'bắc cụ', 'nam cụ'
            ];
            
            // Danh sách từ cần AI phân tích ngữ cảnh (có thể hợp lệ trong một số trường hợp)
            const contextDependentWords = [
                // Gọi mẹ vs chửi thề
                'mẹ', 'má', 'mả', 'mồ', 'mổ',
                // Mô tả ngoại hình vs chế giễu
                'béo', 'mập', 'gầy', 'xấu', 'đen', 'trắng', 'lùn', 'cao', 'thấp',
                // Mô tả trí tuệ vs xúc phạm
                'dốt', 'đần', 'ngớ', 'ngố',
                // Khái niệm vs chống đối
                'anti'
            ];
            
            // Kiểm tra cả text gốc và text đã chuẩn hóa
            const foundBannedWords = [];
            
            // Kiểm tra text gốc (có dấu) - chỉ những từ luôn vi phạm
            accentedBannedWords.forEach(word => {
                const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
                if (wordRegex.test(message.content)) {
                    foundBannedWords.push(word);
                }
            });
            
            // Kiểm tra từ cần AI phân tích ngữ cảnh - tự động đánh giá HIGH cho trường hợp rõ ràng
            let hasContextViolation = false;
            let contextViolationReason = '';
            
            // Kiểm tra pattern thân thiện trước
            const content = message.content.toLowerCase();
            const friendlyPatterns = [
                /chúc\s+(?:ban|bạn|em|anh|chị|bé|con|baby)\s+ngủ\s+ngon/i,
                /chúc\s+(?:ban|bạn|em|anh|chị|bé|con|baby)\s+ngủ\s+ngon\s+ngu/i,
                /ngủ\s+ngon\s+(?:ban|bạn|em|anh|chị|bé|con|baby)/i,
                /ngủ\s+ngon\s+ngu/i,
                /chúc\s+(?:ban|bạn|em|anh|chị|bé|con|baby)\s+(?:ngủ|sleep)\s+(?:ngon|well)/i,
                /good\s+night/i,
                /gn\s+(?:ban|bạn|em|anh|chị|bé|con|baby)/i,
                /gn\s+ngu/i,
                // Pattern cho "chuc ban ngu ngon" (không dấu)
                /chuc\s+(?:ban|bạn|em|anh|chị|bé|con|baby)\s+ngu\s+ngon/i,
                /chuc\s+(?:ban|bạn|em|anh|chị|bé|con|baby)\s+ngu/i,
                /ngu\s+ngon/i,
                // Pattern cho "chúc bé ngu ngon"
                /chúc\s+bé\s+ngu\s+ngon/i,
                /chúc\s+con\s+ngu\s+ngon/i,
                /chúc\s+baby\s+ngu\s+ngon/i
            ];
            
            // Nếu có pattern thân thiện, bỏ qua phân tích ngữ cảnh
            const isFriendly = friendlyPatterns.some(pattern => pattern.test(content));
            if (isFriendly) {
                console.log(`✅ Phát hiện pattern thân thiện: "${message.content}"`);
                console.log(`✅ Bỏ qua phân tích ngữ cảnh cho pattern thân thiện`);
                return {
                    importance: IMPORTANCE_LEVELS.LOW,
                    summary: 'Pattern thân thiện - chúc ngủ ngon',
                    rawResponse: 'Phân tích trực tiếp',
                    violatingMessages: []
                };
            }
            
            contextDependentWords.forEach(word => {
                const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
                if (wordRegex.test(message.content)) {
                    console.log(`🤖 Cần AI phân tích ngữ cảnh: "${word}" trong "${message.content}"`);
                    
                    // Kiểm tra pattern "thằng + tên + từ chế giễu"
                    const thangPattern = /thằng\s+(\w+)\s+(béo|mập|gầy|xấu|đen|trắng|lùn|cao|thấp|ngu|ngốc|dốt|đần|ngớ|ngố)/i;
                    if (thangPattern.test(content)) {
                        hasContextViolation = true;
                        contextViolationReason = 'Có pattern "thằng + tên + từ chế giễu"';
                    }
                    
                    // Kiểm tra pattern "tên + từ chế giễu"
                    const namePattern = /(\w+)\s+(béo|mập|gầy|xấu|đen|trắng|lùn|cao|thấp|ngu|ngốc|dốt|đần|ngớ|ngố)/i;
                    if (namePattern.test(content)) {
                        // Loại trừ trường hợp nói về bản thân
                        if (!content.includes('tôi') && !content.includes('mình') && !content.includes('ta')) {
                            hasContextViolation = true;
                            contextViolationReason = 'Có pattern "tên + từ chế giễu" (không phải nói về bản thân)';
                        }
                    }
                }
            });
            
            // Nếu có vi phạm ngữ cảnh rõ ràng, trả về HIGH ngay lập tức
            if (hasContextViolation) {
                return {
                    importance: IMPORTANCE_LEVELS.HIGH,
                    summary: `Phát hiện xúc phạm ngữ cảnh: ${contextViolationReason}`,
                    rawResponse: 'Phân tích trực tiếp',
                    violatingMessages: [{
                        messageId: message.messageId,
                        authorId: message.authorId,
                        authorName: message.authorName,
                        content: message.content,
                        importance: IMPORTANCE_LEVELS.HIGH,
                        summary: contextViolationReason,
                        bannedWords: ['context_violation']
                    }]
                };
            }
            
            // Kiểm tra text đã chuẩn hóa (không dấu) - chỉ khi từ đứng độc lập
            baseBannedWords.forEach(word => {
                const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
                if (wordRegex.test(normalizedText)) {
                    foundBannedWords.push(word);
                }
            });
            
            // Kiểm tra các biến thể với ký tự đặc biệt
            const specialVariants = [
                'm3', 'm3', 'l0z', 'l0zz', 'd1t', 'd1t', 'b30', 'd4n', 'ng0c', 'd0t',
                'g4y', 'l3s', 'b4c', 'n4m', '4nt1'
            ];
            
            specialVariants.forEach(word => {
                if (messageText.includes(word)) {
                    foundBannedWords.push(word);
                }
            });
            
            // Kiểm tra pattern "anti + tên người" (bao gồm biến thể viết sai và có dấu chấm)
            const antiPatterns = [
                /anti\s+nhi/i,
                /anti\s+dong/i,
                /anti\s+mod/i,
                /anti\s+admin/i,
                /4nt1\s+nhi/i,
                /4nt1\s+dong/i,
                /4nt1\s+mod/i,
                /4nt1\s+admin/i,
                /annti\s+nhi/i,
                /annti\s+dong/i,
                /annti\s+mod/i,
                /annti\s+admin/i,
                /4nnt1\s+nhi/i,
                /4nnt1\s+dong/i,
                /4nnt1\s+mod/i,
                /4nnt1\s+admin/i,
                /4nti\s+nhi/i,
                /4nti\s+dong/i,
                /4nti\s+mod/i,
                /4nti\s+admin/i,
                // Pattern với dấu chấm
                /a\.n\.t\.i\s+nhi/i,
                /a\.n\.t\.i\s+dong/i,
                /a\.n\.t\.i\s+mod/i,
                /a\.n\.t\.i\s+admin/i,
                /4\.n\.t\.1\s+nhi/i,
                /4\.n\.t\.1\s+dong/i,
                /4\.n\.t\.1\s+mod/i,
                /4\.n\.t\.1\s+admin/i,
                // Pattern với khoảng trắng
                /a\s+n\s+t\s+i\s+nhi/i,
                /a\s+n\s+t\s+i\s+dong/i,
                /a\s+n\s+t\s+i\s+mod/i,
                /a\s+n\s+t\s+i\s+admin/i,
                /4\s+n\s+t\s+1\s+nhi/i,
                /4\s+n\s+t\s+1\s+dong/i,
                /4\s+n\s+t\s+1\s+mod/i,
                /4\s+n\s+t\s+1\s+admin/i
            ];
            
            antiPatterns.forEach(pattern => {
                if (pattern.test(messageText)) {
                    foundBannedWords.push('anti pattern');
                }
            });
            
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
    analyzeMessagesWithGPT,
    CHAT_ANALYZER_CONFIG,
    COLLECTIONS,
    PROCESSING_STATUS,
    IMPORTANCE_LEVELS
}; 