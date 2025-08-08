const { EmbedBuilder } = require('discord.js');
const { saveUserUsage, getUserUsage, resetUserUsageForNewDay, isDatabaseConnected } = require('./database');

// Cấu hình cooldown (tính bằng milliseconds)
const COOLDOWNS = {
    // Lệnh cơ bản
    'tarot': 30000,      // 30 giây
    'tarot3': 60000,     // 1 phút  
    'tarot5': 120000,    // 2 phút
    'tarotdaily': 86400000, // 24 giờ (1 ngày)
    
    // Lệnh chuyên đề
    'tarotlove': 300000,   // 5 phút
    'tarotwork': 300000,   // 5 phút
    'tarotmoney': 300000,  // 5 phút
    
    // Lệnh khác
    'tarotselect': 60000,  // 1 phút
    'tarothelp': 10000     // 10 giây
};

// Giới hạn tổng số lệnh bói bài mỗi ngày cho 1 user (THAY ĐỔI TỪ 10 XUỐNG 2)
const TOTAL_DAILY_LIMIT = 2;

// Các lệnh được tính vào giới hạn tổng (không bao gồm help và stats)
const TAROT_COMMANDS = [
    'tarot', 'tarot3', 'tarot5', 'tarotdaily', 
    'tarotlove', 'tarotwork', 'tarotmoney', 'tarotselect'
];

// Giới hạn riêng cho một số lệnh đặc biệt
const SPECIAL_LIMITS = {
    'tarotdaily': 1,    // Chỉ 1 lần/ngày
    'tarothelp': 20     // Không tính vào tổng, giới hạn riêng
};

// Lưu trữ cooldown data (vẫn dùng in-memory cho cooldown vì cần real-time)
const userCooldowns = new Map(); // userId -> { commandName: timestamp }

// Fallback storage cho trường hợp database không khả dụng
const fallbackUserUsage = new Map(); // userId -> { date: string, commands: { commandName: count }, totalTarotCommands: number }

/**
 * Kiểm tra cooldown cho user và command
 * @param {string} userId - ID của user
 * @param {string} commandName - Tên command
 * @returns {Object} { canUse: boolean, timeLeft: number }
 */
function checkCooldown(userId, commandName) {
    const now = Date.now();
    const cooldownTime = COOLDOWNS[commandName] || 30000; // Default 30s
    
    if (!userCooldowns.has(userId)) {
        userCooldowns.set(userId, {});
    }
    
    const userCooldown = userCooldowns.get(userId);
    const lastUsed = userCooldown[commandName] || 0;
    const timeLeft = lastUsed + cooldownTime - now;
    
    if (timeLeft > 0) {
        return { canUse: false, timeLeft };
    }
    
    // Cập nhật thời gian sử dụng
    userCooldown[commandName] = now;
    return { canUse: true, timeLeft: 0 };
}

/**
 * Lấy usage data từ fallback storage
 * @param {string} userId - ID của user
 * @param {string} date - Ngày
 * @returns {Object} Usage data
 */
function getFallbackUserUsage(userId, date) {
    if (!fallbackUserUsage.has(userId)) {
        fallbackUserUsage.set(userId, { date, commands: {}, totalTarotCommands: 0 });
    }
    
    const userData = fallbackUserUsage.get(userId);
    
    // Reset nếu là ngày mới
    if (userData.date !== date) {
        userData.date = date;
        userData.commands = {};
        userData.totalTarotCommands = 0;
    }
    
    return userData;
}

/**
 * Lưu usage data vào fallback storage
 * @param {string} userId - ID của user
 * @param {string} commandName - Tên command
 * @param {string} date - Ngày
 * @param {boolean} isTarotCommand - Có phải lệnh tarot không
 */
function saveFallbackUserUsage(userId, commandName, date, isTarotCommand) {
    const userData = getFallbackUserUsage(userId, date);
    
    userData.commands[commandName] = (userData.commands[commandName] || 0) + 1;
    if (isTarotCommand) {
        userData.totalTarotCommands += 1;
    }
}

/**
 * Kiểm tra giới hạn hàng ngày (SỬ DỤNG MONGODB + FALLBACK)
 * @param {string} userId - ID của user
 * @param {string} commandName - Tên command
 * @returns {Promise<Object>} { canUse: boolean, usedCount: number, totalUsed: number, limit: number, reason: string }
 */
async function checkDailyLimit(userId, commandName) {
    try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        let userData;
        
        // Kiểm tra database có khả dụng không
        if (isDatabaseConnected()) {
            // Lấy usage data từ MongoDB
            userData = await getUserUsage(userId, today);
        } else {
            // Sử dụng fallback storage
            userData = getFallbackUserUsage(userId, today);
        }
        
        // Kiểm tra giới hạn đặc biệt trước (như tarotdaily)
        if (SPECIAL_LIMITS[commandName]) {
            const usedCount = userData.commands[commandName] || 0;
            if (usedCount >= SPECIAL_LIMITS[commandName]) {
                return { 
                    canUse: false, 
                    usedCount, 
                    totalUsed: userData.totalTarotCommands || 0,
                    limit: SPECIAL_LIMITS[commandName], 
                    reason: 'special_limit' 
                };
            }
        }
        
        // Kiểm tra giới hạn tổng cho lệnh tarot (không áp dụng cho help, stats)
        if (TAROT_COMMANDS.includes(commandName)) {
            if ((userData.totalTarotCommands || 0) >= TOTAL_DAILY_LIMIT) {
                return { 
                    canUse: false, 
                    usedCount: userData.commands[commandName] || 0,
                    totalUsed: userData.totalTarotCommands || 0,
                    limit: TOTAL_DAILY_LIMIT, 
                    reason: 'total_limit' 
                };
            }
            
            // Lưu usage
            if (isDatabaseConnected()) {
                await saveUserUsage(userId, commandName, {
                    date: today,
                    isTarotCommand: true
                });
            } else {
                saveFallbackUserUsage(userId, commandName, today, true);
            }
            
            return { 
                canUse: true, 
                usedCount: (userData.commands[commandName] || 0) + 1,
                totalUsed: (userData.totalTarotCommands || 0) + 1,
                limit: TOTAL_DAILY_LIMIT, 
                reason: 'allowed' 
            };
        }
        
        // Đối với lệnh không phải tarot (help, stats)
        const usedCount = userData.commands[commandName] || 0;
        const limit = SPECIAL_LIMITS[commandName] || 50; // Default limit cao cho non-tarot commands
        
        if (usedCount >= limit) {
            return { 
                canUse: false, 
                usedCount, 
                totalUsed: userData.totalTarotCommands || 0,
                limit, 
                reason: 'special_limit' 
            };
        }
        
        // Lưu usage
        if (isDatabaseConnected()) {
            await saveUserUsage(userId, commandName, {
                date: today,
                isTarotCommand: false
            });
        } else {
            saveFallbackUserUsage(userId, commandName, today, false);
        }
        
        return { 
            canUse: true, 
            usedCount: usedCount + 1, 
            totalUsed: userData.totalTarotCommands || 0,
            limit, 
            reason: 'allowed' 
        };
    } catch (error) {
        console.error('❌ Lỗi kiểm tra daily limit:', error);
        // Fallback: cho phép sử dụng nếu có lỗi database
        return { 
            canUse: true, 
            usedCount: 0, 
            totalUsed: 0,
            limit: TOTAL_DAILY_LIMIT, 
            reason: 'database_error' 
        };
    }
}

/**
 * Tạo embed thông báo cooldown
 * @param {number} timeLeft - Thời gian còn lại (ms)
 * @param {string} commandName - Tên command
 * @returns {EmbedBuilder}
 */
function createCooldownEmbed(timeLeft, commandName) {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    let timeString;
    if (minutes > 0) {
        timeString = `${minutes} phút ${seconds} giây`;
    } else {
        timeString = `${seconds} giây`;
    }
    
    return new EmbedBuilder()
        .setTitle('⏰ Vui Lòng Chờ')
        .setDescription(`Bạn cần chờ **${timeString}** trước khi sử dụng lệnh \`!${commandName}\` lại.`)
        .setColor('#FFA500')
        .addFields({
            name: '💡 Tại sao có cooldown?',
            value: 'Để đảm bảo chất lượng AI và tránh spam, mỗi lệnh có thời gian chờ riêng.',
            inline: false
        })
        .setFooter({ text: 'Hãy kiên nhẫn để có trải nghiệm tốt nhất!' })
        .setTimestamp();
}

/**
 * Tạo embed thông báo vượt giới hạn hàng ngày
 * @param {string} commandName - Tên command
 * @param {Object} limitInfo - Thông tin giới hạn
 * @returns {EmbedBuilder}
 */
function createDailyLimitEmbed(commandName, limitInfo) {
    const { reason, totalUsed, limit, usedCount } = limitInfo;
    
    let title, description, suggestions;
    
    if (reason === 'total_limit') {
        title = '🚫 Đã Hết Quota Bói Bài Hôm Nay';
        description = `Bạn đã sử dụng **${totalUsed}/${TOTAL_DAILY_LIMIT}** lệnh bói bài hôm nay.`;
        suggestions = `
        • Quota sẽ được reset vào **00:00 (UTC+7)**
        • Bạn vẫn có thể dùng \`!tarothelp\` và \`!tarotstats\`
        • Hãy quay lại vào ngày mai để tiếp tục bói bài!
        `;
    } else if (reason === 'special_limit' && commandName === 'tarotdaily') {
        title = '🌅 Đã Sử Dụng Bài Hàng Ngày';
        description = `Bạn đã rút bài hàng ngày hôm nay rồi! (**${usedCount}/${limit}**)`;
        suggestions = `
        • Bài hàng ngày chỉ được rút **1 lần/ngày**
        • Hãy thử các lệnh khác: \`!tarot\`, \`!tarotlove\`, \`!tarotwork\`
        • Quota reset vào **00:00 (UTC+7)**
        `;
    } else {
        title = '🚫 Đã Đạt Giới Hạn Lệnh';
        description = `Bạn đã sử dụng lệnh \`!${commandName}\` **${usedCount}/${limit}** lần hôm nay.`;
        suggestions = `
        • Hãy thử các lệnh bói bài khác
        • Quota reset vào **00:00 (UTC+7)**
        `;
    }
    
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('#FF4500')
        .addFields(
            {
                name: '📊 Thống Kê Hôm Nay',
                value: `**Tổng lệnh bói bài:** ${totalUsed}/${TOTAL_DAILY_LIMIT}`,
                inline: false
            },
            {
                name: '💡 Gợi Ý',
                value: suggestions,
                inline: false
            }
        )
        .setFooter({ text: `Giới hạn ${TOTAL_DAILY_LIMIT} lệnh/ngày giúp đảm bảo trải nghiệm công bằng cho mọi người` })
        .setTimestamp();
}

/**
 * Kiểm tra spam (nhiều lệnh trong thời gian ngắn)
 * @param {string} userId - ID của user
 * @returns {Object} { isSpamming: boolean, warningLevel: number }
 */
function checkSpamming(userId) {
    const now = Date.now();
    const timeWindow = 60000; // 1 phút
    const maxCommands = 8; // Tối đa 8 lệnh/phút
    
    if (!userCooldowns.has(userId)) {
        return { isSpamming: false, warningLevel: 0 };
    }
    
    const userCooldown = userCooldowns.get(userId);
    const recentCommands = Object.values(userCooldown)
        .filter(timestamp => now - timestamp < timeWindow);
    
    const commandCount = recentCommands.length;
    
    if (commandCount >= maxCommands) {
        return { isSpamming: true, warningLevel: 3 };
    } else if (commandCount >= 6) {
        return { isSpamming: false, warningLevel: 2 };
    } else if (commandCount >= 4) {
        return { isSpamming: false, warningLevel: 1 };
    }
    
    return { isSpamming: false, warningLevel: 0 };
}

/**
 * Tạo embed cảnh báo spam
 * @param {number} warningLevel - Mức độ cảnh báo (1-3)
 * @returns {EmbedBuilder}
 */
function createSpamWarningEmbed(warningLevel) {
    const warnings = {
        1: {
            title: '⚠️ Cảnh Báo Nhẹ',
            description: 'Bạn đang sử dụng lệnh khá nhanh. Hãy chậm lại một chút!',
            color: '#FFFF00'
        },
        2: {
            title: '⚠️ Cảnh Báo Nghiêm Trọng',
            description: 'Bạn đang sử dụng lệnh quá nhanh! Vui lòng chậm lại.',
            color: '#FF8C00'
        },
        3: {
            title: '🚫 Tạm Khóa Do Spam',
            description: 'Bạn đã bị tạm khóa 5 phút do spam lệnh quá nhiều!',
            color: '#FF0000'
        }
    };
    
    const warning = warnings[warningLevel];
    
    return new EmbedBuilder()
        .setTitle(warning.title)
        .setDescription(warning.description)
        .setColor(warning.color)
        .addFields({
            name: '💡 Lời khuyên',
            value: 'Hãy sử dụng bot một cách có ý thức để mọi người đều có trải nghiệm tốt!',
            inline: false
        })
        .setFooter({ text: 'Cảm ơn bạn đã hiểu và hợp tác!' })
        .setTimestamp();
}

/**
 * Lấy thống kê sử dụng của user (SỬ DỤNG MONGODB + FALLBACK)
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Thống kê sử dụng
 */
async function getUserStats(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        let userData;
        
        if (isDatabaseConnected()) {
            userData = await getUserUsage(userId, today);
        } else {
            userData = getFallbackUserUsage(userId, today);
        }
        
        const totalToday = Object.values(userData.commands || {}).reduce((sum, count) => sum + count, 0);
        const totalTarotCommands = userData.totalTarotCommands || 0;
        
        return {
            date: userData.date,
            commands: userData.commands || {},
            totalToday,
            totalTarotCommands,
            remainingQuota: Math.max(0, TOTAL_DAILY_LIMIT - totalTarotCommands)
        };
    } catch (error) {
        console.error('❌ Lỗi lấy user stats:', error);
        // Fallback data
        return {
            date: new Date().toISOString().split('T')[0],
            commands: {},
            totalToday: 0,
            totalTarotCommands: 0,
            remainingQuota: TOTAL_DAILY_LIMIT
        };
    }
}

/**
 * Dọn dẹp dữ liệu cũ (gọi định kỳ)
 */
function cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 giờ
    
    // Dọn cooldown cũ
    for (const [userId, cooldowns] of userCooldowns) {
        const cleanedCooldowns = {};
        let hasValidCooldown = false;
        
        for (const [command, timestamp] of Object.entries(cooldowns)) {
            if (now - timestamp < maxAge) {
                cleanedCooldowns[command] = timestamp;
                hasValidCooldown = true;
            }
        }
        
        if (hasValidCooldown) {
            userCooldowns.set(userId, cleanedCooldowns);
        } else {
            userCooldowns.delete(userId);
        }
    }
    
    // Dọn fallback storage cũ
    const today = new Date().toISOString().split('T')[0];
    for (const [userId, userData] of fallbackUserUsage) {
        if (userData.date !== today) {
            fallbackUserUsage.delete(userId);
        }
    }
}

// Dọn dẹp mỗi giờ
setInterval(cleanup, 60 * 60 * 1000);

module.exports = {
    checkCooldown,
    checkDailyLimit,
    checkSpamming,
    createCooldownEmbed,
    createDailyLimitEmbed,
    createSpamWarningEmbed,
    getUserStats,
    COOLDOWNS,
    TOTAL_DAILY_LIMIT,
    TAROT_COMMANDS,
    SPECIAL_LIMITS
};