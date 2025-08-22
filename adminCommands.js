const { EmbedBuilder } = require('discord.js');

// Danh sách admin IDs (thêm Discord ID của bạn vào đây)
const ADMIN_IDS = [
    '389957152153796608',
];

/**
 * Kiểm tra user có phải admin không
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
function isAdmin(userId) {
    return ADMIN_IDS.includes(userId);
}

/**
 * Tạo embed hiển thị lệnh admin
 * @returns {EmbedBuilder}
 */
function createAdminHelpEmbed() {
    return new EmbedBuilder()
        .setTitle('🛠️ Lệnh Admin - Tarot Bot')
        .setColor('#FF6347')
        .setDescription('Các lệnh dành cho admin để quản lý bot')
        .addFields(
            {
                name: '📊 Thống Kê',
                value: `
                \`!admininfo\` - Thông tin tổng quan về bot
                \`!userstats @user\` - Xem stats của user cụ thể
                \`!topusers\` - Top 10 user sử dụng nhiều nhất
                `,
                inline: false
            },
            {
                name: '🔧 Quản Lý',
                value: `
                \`!resetuser @user\` - Reset cooldown và stats của user
                \`!resetall\` - Reset tất cả cooldown và stats
                \`!setcooldown <command> <seconds>\` - Thay đổi cooldown
                `,
                inline: false
            },
            {
                name: '🚫 Kiểm Soát',
                value: `
                \`!banuser @user\` - Cấm user sử dụng bot
                \`!unbanuser @user\` - Bỏ cấm user
                \`!banlist\` - Xem danh sách user bị cấm
                `,
                inline: false
            }
        )
        .setFooter({ text: 'Chỉ admin mới có thể sử dụng các lệnh này' })
        .setTimestamp();
}

/**
 * Tạo embed thông tin tổng quan bot
 * @param {Map} userCooldowns - Map cooldown data
 * @param {Map} userUsage - Map usage data
 * @returns {EmbedBuilder}
 */
function createBotInfoEmbed(userCooldowns, userUsage) {
    const totalUsers = new Set([...userCooldowns.keys(), ...userUsage.keys()]).size;
    const activeUsers = userUsage.size;
    
    let totalCommandsToday = 0;
    const commandStats = {};
    
    for (const userData of userUsage.values()) {
        for (const [command, count] of Object.entries(userData.commands)) {
            totalCommandsToday += count;
            commandStats[command] = (commandStats[command] || 0) + count;
        }
    }
    
    const topCommands = Object.entries(commandStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([cmd, count]) => `\`!${cmd}\`: ${count} lần`)
        .join('\n') || 'Chưa có dữ liệu';

    return new EmbedBuilder()
        .setTitle('🤖 Thông Tin Bot')
        .setColor('#32CD32')
        .addFields(
            {
                name: '👥 Người Dùng',
                value: `
                **Tổng users đã dùng:** ${totalUsers}
                **Users hoạt động hôm nay:** ${activeUsers}
                `,
                inline: true
            },
            {
                name: '📈 Hoạt Động Hôm Nay',
                value: `
                **Tổng lệnh:** ${totalCommandsToday}
                **Trung bình/user:** ${activeUsers > 0 ? Math.round(totalCommandsToday / activeUsers) : 0}
                `,
                inline: true
            },
            {
                name: '🔥 Top Commands Hôm Nay',
                value: topCommands,
                inline: false
            }
        )
        .setTimestamp()
        .setFooter({ text: 'Dữ liệu được reset mỗi ngày' });
}

/**
 * Tạo embed top users
 * @param {Map} userUsage - Map usage data
 * @returns {EmbedBuilder}
 */
function createTopUsersEmbed(userUsage) {
    const userStats = [];
    
    for (const [userId, userData] of userUsage) {
        const totalCommands = Object.values(userData.commands).reduce((sum, count) => sum + count, 0);
        if (totalCommands > 0) {
            userStats.push({ userId, totalCommands, commands: userData.commands });
        }
    }
    
    userStats.sort((a, b) => b.totalCommands - a.totalCommands);
    const top10 = userStats.slice(0, 10);
    
    const topList = top10.map((user, index) => {
        const mostUsedCmd = Object.entries(user.commands)
            .sort(([,a], [,b]) => b - a)[0];
        
        return `**${index + 1}.** <@${user.userId}> - ${user.totalCommands} lệnh (${mostUsedCmd ? `!${mostUsedCmd[0]}` : 'N/A'})`;
    }).join('\n') || 'Chưa có dữ liệu';

    return new EmbedBuilder()
        .setTitle('🏆 Top 10 Users Hôm Nay')
        .setColor('#FFD700')
        .setDescription(topList)
        .setTimestamp()
        .setFooter({ text: 'Thống kê dựa trên số lệnh sử dụng hôm nay' });
}

module.exports = {
    isAdmin,
    createAdminHelpEmbed,
    createBotInfoEmbed,
    createTopUsersEmbed,
    ADMIN_IDS
};