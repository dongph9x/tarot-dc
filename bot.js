require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { drawRandomCard, drawMultipleCards, getCardByIndex } = require('./cardUtils');
const { getChatGPTReading, getQuickReading } = require('./chatgptReader');
const { 
    createCardListEmbed, 
    createCardTypeSelector, 
    createCardSelector,
    createActionButtons,
    createSelectedCardsEmbed,
    createQuestionModal
} = require('./cardSelector');
const {
    checkCooldown,
    checkDailyLimit,
    checkSpamming,
    createCooldownEmbed,
    createDailyLimitEmbed,
    createSpamWarningEmbed,
    getUserStats
} = require('./antiSpam');
const { connectToDatabase, isDatabaseConnected, getDatabase } = require('./database');
const { initializeChatAnalyzer, processChatAnalyzerCommands } = require('./chatAnalyzerIntegration');
const path = require('path');
const fs = require('fs');

// Tạo Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Cấu hình prefix
const PREFIX = '!';

// Lưu trữ tạm thời các lựa chọn bài của user
const userSelections = new Map();

// Danh sách các commands có sẵn - TẤT CẢ DÙNG AI
const commands = {
    'tarot': 'Rút 1 lá bài và luận giải bằng ChatGPT',
    'tarot3': 'Rút 3 lá bài (Quá khứ-Hiện tại-Tương lai) + phân tích AI', 
    'tarot5': 'Rút 5 lá bài (Phân tích tổng quan) + luận giải AI',
    'tarotdaily': 'Bài hàng ngày với lời khuyên chi tiết từ ChatGPT',
    'tarotlove': 'Luận bài tình yêu với ChatGPT',
    'tarotwork': 'Luận bài sự nghiệp với ChatGPT',
    'tarotmoney': 'Luận bài tài chính với ChatGPT',
    'tarotselect': 'Chọn bài thủ công để luận giải với ChatGPT',
    'tarothelp': 'Hướng dẫn sử dụng bot bói bài tarot AI',
    'tarotstats': 'Xem thống kê sử dụng của bạn'
};

// Tạo embed cho một lá bài
function createCardEmbed(card, title = "🔮 Lá Bài Tarot Của Bạn") {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(card.type === 'major' ? '#8B0000' : '#4B0082')
        .addFields(
            { 
                name: `${card.name} (${card.orientation})`, 
                value: `**Loại:** ${card.type === 'major' ? 'Major Arcana' : 'Minor Arcana'}`,
                inline: false 
            },
            { 
                name: '🔍 Ý Nghĩa', 
                value: card.currentMeaning,
                inline: false 
            }
        )
        .setTimestamp()
        .setFooter({ 
            text: 'Tarot Bot • Lời khuyên chỉ mang tính tham khảo',
            iconURL: 'https://cdn.discordapp.com/emojis/🔮.png'
        });

    // Thêm màu khác nhau cho bài xuôi/ngược
    if (card.isReversed) {
        embed.setColor('#8B4513'); // Màu nâu cho bài ngược
    }

    return embed;
}

// Tạo embed cho nhiều lá bài
function createMultiCardEmbed(cards, title, positions = []) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor('#800080')
        .setTimestamp()
        .setFooter({ 
            text: 'Tarot Bot • Lời khuyên chỉ mang tính tham khảo' 
        });

    cards.forEach((card, index) => {
        const position = positions[index] || `Vị trí ${index + 1}`;
        embed.addFields({
            name: `${position}: ${card.name} (${card.orientation})`,
            value: `**Ý nghĩa:** ${card.currentMeaning}`,
            inline: false
        });
    });

    return embed;
}

// Tạo embed hướng dẫn
function createHelpEmbed() {
    const commandList = Object.entries(commands)
        .map(([cmd, desc]) => `\`${PREFIX}${cmd}\` - ${desc}`)
        .join('\n');

    const dbStatus = isDatabaseConnected() ? '✅ Đã kết nối' : '⚠️ Không khả dụng (Fallback mode)';

    return new EmbedBuilder()
        .setTitle('🔮 Hướng Dẫn Sử Dụng Tarot Bot')
        .setColor('#FFD700')
        .setDescription('Bot bói bài tarot với 78 lá bài truyền thống, hỗ trợ tiếng Việt')
        .addFields(
            {
                name: '📋 Các Lệnh Có Sẵn',
                value: commandList,
                inline: false
            },
            {
                name: '🎯 Chuyên Đề',
                value: `
                • **${PREFIX}tarotlove** - Luận bài tình yêu 3 lá
                • **${PREFIX}tarotwork** - Luận bài sự nghiệp 3 lá  
                • **${PREFIX}tarotmoney** - Luận bài tài chính 3 lá
                • **${PREFIX}tarotselect** - Chọn bài thủ công để luận
                `,
                inline: false
            },
            {
                name: '🃏 Về Bài Tarot',
                value: `
                • **Major Arcana:** 22 lá bài chính, thể hiện các bài học lớn trong cuộc sống
                • **Minor Arcana:** 56 lá bài, chia thành 4 bộ (Gậy, Cốc, Kiếm, Tiền)
                • **Xuôi/Ngược:** Mỗi lá có thể xuất hiện ở vị trí xuôi hoặc ngược với ý nghĩa khác nhau
                `,
                inline: false
            },
            {
                name: '🤖 Về AI',
                value: `
                • **Tất cả commands đều sử dụng ChatGPT** để luận bài chi tiết
                • **Phân tích chuyên sâu** theo từng chủ đề cụ thể
                • **Lời khuyên thực tế** và dễ áp dụng
                `,
                inline: false
            },
            {
                name: '⏰ Hệ Thống Cooldown',
                value: `
                • **!tarot**: 30 giây
                • **!tarot3**: 1 phút  
                • **!tarot5**: 2 phút
                • **!tarotdaily**: 24 giờ (1 lần/ngày)
                • **Chuyên đề**: 5 phút
                `,
                inline: false
            },
            {
                name: '🎯 Quota Hàng Ngày',
                value: `
                • **Tổng quota**: 3 lệnh bói bài/ngày/user
                • **Bao gồm**: tarot, tarot3, tarot5, tarotdaily, tarotlove, tarotwork, tarotmoney, tarotselect
                • **Không tính**: tarothelp, tarotstats
                • **Reset**: 00:00 UTC+7 mỗi ngày
                `,
                inline: false
            },
            {
                name: '🛡️ Chống Spam',
                value: `
                • **Rate limit**: Tối đa 8 lệnh/phút
                • **Cảnh báo**: 3 mức độ tăng dần
                • **Tạm khóa**: 5 phút nếu spam quá nhiều
                • **Xem quota**: \`${PREFIX}tarotstats\`
                `,
                inline: false
            },
            {
                name: '🗄️ Trạng Thái Database',
                value: `**MongoDB**: ${dbStatus}`,
                inline: false
            },
            {
                name: '⚠️ Lưu Ý',
                value: 'Kết quả AI chỉ mang tính giải trí và tham khảo. Hãy sử dụng trí tuệ của bạn để đưa ra quyết định trong cuộc sống.',
                inline: false
            }
        )
        .setTimestamp();
}

// Xử lý khi bot sẵn sàng
client.once('ready', async () => {
    console.log(`✅ Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
    console.log(`🎯 Prefix: ${PREFIX}`);
    console.log(`📋 Commands: ${Object.keys(commands).length} lệnh có sẵn`);
    
    // Kết nối MongoDB
    try {
        await connectToDatabase();
        console.log('✅ Database connection OK');
        
        // Khởi tạo Chat Analyzer
        initializeChatAnalyzer(client, getDatabase());
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        console.log('⚠️ Bot sẽ hoạt động với fallback mode (quota sẽ reset khi restart)');
    }
    
    // Test cardUtils để đảm bảo hoạt động
    try {
        const testCard = drawRandomCard();
        console.log(`✅ Card system test OK: ${testCard.name}`);
    } catch (error) {
        console.error('❌ Card system test failed:', error);
    }
});

// Xử lý message commands
client.on('messageCreate', async message => {
    // Bỏ qua bot messages và messages không có prefix
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Kiểm tra command có tồn tại không
    if (!commands[commandName]) return;

    // Kiểm tra channel cho phép sử dụng tarot (nếu có cấu hình)
    const tarotChannelId = process.env.TAROT_CHANNEL_ID;
    if (tarotChannelId && message.channel.id !== tarotChannelId) {
        const channelRestrictionEmbed = new EmbedBuilder()
            .setTitle('🚫 Không được phép')
            .setDescription(`Chức năng bói bài chỉ được sử dụng trong channel <#${tarotChannelId}>`)
            .setColor('#FF0000')
            .setTimestamp();
        await message.reply({ embeds: [channelRestrictionEmbed] });
        return;
    }

    const userId = message.author.id;
    
    // Kiểm tra spam
    const spamCheck = checkSpamming(userId);
    if (spamCheck.isSpamming) {
        const warningEmbed = createSpamWarningEmbed(spamCheck.warningLevel);
        await message.reply({ embeds: [warningEmbed] });
        return;
    }
    
    // Hiển thị cảnh báo nếu cần
    if (spamCheck.warningLevel > 0) {
        const warningEmbed = createSpamWarningEmbed(spamCheck.warningLevel);
        await message.reply({ embeds: [warningEmbed] });
    }
    
    // Kiểm tra cooldown
    const cooldownCheck = checkCooldown(userId, commandName);
    if (!cooldownCheck.canUse) {
        const cooldownEmbed = createCooldownEmbed(cooldownCheck.timeLeft, commandName);
        await message.reply({ embeds: [cooldownEmbed] });
        return;
    }
    
    // Kiểm tra giới hạn hàng ngày
    const dailyCheck = await checkDailyLimit(userId, commandName);
    if (!dailyCheck.canUse) {
        const limitEmbed = createDailyLimitEmbed(commandName, dailyCheck);
        await message.reply({ embeds: [limitEmbed] });
        return;
    }
    
    // Xử lý Chat Analyzer commands
    const chatAnalyzerHandled = await processChatAnalyzerCommands(message, commandName, getDatabase());
    if (chatAnalyzerHandled) return;

    try {
        switch (commandName) {
            case 'tarot': {
                const card = drawRandomCard();
                const embed = createCardEmbed(card, '🤖 AI Đang Luận Bài...');
                
                const reply = await message.reply({ embeds: [embed] });
                
                // Gọi ChatGPT để luận bài
                try {
                    const reading = await getChatGPTReading('single', [card]);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle(`🔮 ${card.name} (${card.orientation})`)
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor(card.type === 'major' ? '#8B0000' : '#4B0082')
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài bởi ChatGPT • Chỉ mang tính tham khảo' });
                    
                    // Thêm ảnh bài
                    const imagePath = path.join(__dirname, card.imagePath);
                    if (fs.existsSync(imagePath)) {
                        const attachment = new AttachmentBuilder(imagePath, { 
                            name: `tarot_${card.index}.webp` 
                        });
                        readingEmbed.setImage(`attachment://tarot_${card.index}.webp`);
                        await reply.edit({ embeds: [readingEmbed], files: [attachment] });
                    } else {
                        await reply.edit({ embeds: [readingEmbed] });
                    }
                } catch (error) {
                    console.error('ChatGPT reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI')
                        .setDescription('Không thể kết nối ChatGPT. Hiển thị ý nghĩa cơ bản.')
                        .addFields({ name: card.name, value: card.currentMeaning })
                        .setColor('#FF0000');
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarot3': {
                const cards = drawMultipleCards(3);
                const positions = ['🌅 Quá Khứ', '⭐ Hiện Tại', '🌙 Tương Lai'];
                const embed = createMultiCardEmbed(
                    cards, 
                    '🤖 AI Đang Phân Tích 3 Lá Bài...', 
                    positions
                );

                const reply = await message.reply({ embeds: [embed] });
                
                // Gọi ChatGPT để luận bài
                try {
                    const reading = await getChatGPTReading('threecards', cards);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('🔮 Dòng Chảy Thời Gian - Luận Bài AI')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#800080')
                        .addFields(
                            { name: `${positions[0]}: ${cards[0].name}`, value: `${cards[0].orientation}`, inline: true },
                            { name: `${positions[1]}: ${cards[1].name}`, value: `${cards[1].orientation}`, inline: true },
                            { name: `${positions[2]}: ${cards[2].name}`, value: `${cards[2].orientation}`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài bởi ChatGPT • Chỉ mang tính tham khảo' });
                    
                    await reply.edit({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('ChatGPT reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI - Hiển thị bài cơ bản')
                        .setColor('#FF0000');
                    cards.forEach((card, index) => {
                        errorEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: card.currentMeaning,
                            inline: false 
                        });
                    });
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarot5': {
                const cards = drawMultipleCards(5);
                const positions = [
                    '🎯 Tình Huống Hiện Tại', 
                    '🚧 Thử Thách/Trở Ngại', 
                    '🌟 Mục Tiêu/Khát Vong', 
                    '🔍 Quá Khứ Ảnh Hưởng', 
                    '🚀 Kết Quả Có Thể'
                ];
                const embed = createMultiCardEmbed(
                    cards, 
                    '🤖 AI Đang Phân Tích 5 Lá Bài...', 
                    positions
                );

                const reply = await message.reply({ embeds: [embed] });
                
                // Gọi ChatGPT để luận bài
                try {
                    const reading = await getChatGPTReading('fivecards', cards);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('🔮 Phân Tích Tổng Quan - Luận Bài AI')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#800080')
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài bởi ChatGPT • Chỉ mang tính tham khảo' });
                    
                    // Thêm thông tin các bài
                    cards.forEach((card, index) => {
                        readingEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: `${card.orientation}`,
                            inline: true 
                        });
                    });
                    
                    await reply.edit({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('ChatGPT reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI - Hiển thị bài cơ bản')
                        .setColor('#FF0000');
                    cards.forEach((card, index) => {
                        errorEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: card.currentMeaning,
                            inline: false 
                        });
                    });
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarothelp': {
                const embed = createHelpEmbed();
                await message.reply({ embeds: [embed] });
                break;
            }

            case 'tarotselect': {
                const embed = createCardListEmbed('all');
                const typeSelector = createCardTypeSelector();
                
                // Khởi tạo selection cho user
                userSelections.set(message.author.id, {
                    selectedCards: [],
                    lastInteraction: Date.now()
                });
                
                await message.reply({ 
                    embeds: [embed],
                    components: [typeSelector]
                });
                break;
            }

            case 'tarotdaily': {
                const card = drawRandomCard();
                const embed = createCardEmbed(card, '🌅 Bài Tarot Hàng Ngày');
                
                // Tạo attachment cho ảnh bài
                const imagePath = path.join(__dirname, card.imagePath);
                let attachment = null;
                
                if (fs.existsSync(imagePath)) {
                    attachment = new AttachmentBuilder(imagePath, { 
                        name: `daily_tarot_${card.index}.webp` 
                    });
                    embed.setImage(`attachment://daily_tarot_${card.index}.webp`);
                }

                const reply = await message.reply({ 
                    embeds: [embed],
                    files: attachment ? [attachment] : []
                });
                
                // Gọi ChatGPT để tạo lời khuyên hàng ngày
                try {
                    const dailyAdvice = await getQuickReading([card]);
                    
                    const adviceEmbed = new EmbedBuilder()
                        .setTitle('💡 Lời Khuyên Hàng Ngày')
                        .setDescription(dailyAdvice)
                        .setColor('#FFD700')
                        .setTimestamp()
                        .setFooter({ text: 'Lời khuyên từ ChatGPT • Chúc bạn ngày mới tốt lành!' });
                    
                    await reply.reply({ embeds: [adviceEmbed] });
                } catch (error) {
                    console.error('Daily advice error:', error);
                }
                break;
            }

            case 'tarotlove': {
                const cards = drawMultipleCards(3);
                const positions = ['💝 Tình Cảm Hiện Tại', '💕 Thách Thức', '💖 Tương Lai Tình Yêu'];
                const embed = createMultiCardEmbed(cards, '🤖 AI Đang Phân Tích Tình Yêu...', positions);
                
                const reply = await message.reply({ embeds: [embed] });
                
                try {
                    const lovePrompt = `
Bạn là chuyên gia tarot về tình yêu. Hãy luận giải 3 lá bài sau trong bối cảnh tình yêu và các mối quan hệ:

**Tình cảm hiện tại:** ${cards[0].name} (${cards[0].orientation})
**Thách thức:** ${cards[1].name} (${cards[1].orientation})  
**Tương lai tình yêu:** ${cards[2].name} (${cards[2].orientation})

Hãy tập trung vào:
- Tình trạng mối quan hệ hiện tại
- Những khó khăn cần vượt qua
- Lời khuyên để cải thiện tình yêu
- Dự báo về tương lai tình cảm

Viết bằng tiếng Việt, phong cách ấm áp và khuyến khích.`;

                    const reading = await getChatGPTReading('custom', cards, lovePrompt);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('💕 Luận Bài Tình Yêu')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#FF69B4')
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài tình yêu bởi AI • Yêu thương bản thân trước!' });
                    
                    await reply.edit({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('Love reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI - Hiển thị ý nghĩa cơ bản')
                        .setColor('#FF0000');
                    cards.forEach((card, index) => {
                        errorEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: card.currentMeaning,
                            inline: false 
                        });
                    });
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarotwork': {
                const cards = drawMultipleCards(3);
                const positions = ['💼 Công Việc Hiện Tại', '⚡ Cơ Hội', '🎯 Hướng Phát Triển'];
                const embed = createMultiCardEmbed(cards, '🤖 AI Đang Phân Tích Sự Nghiệp...', positions);
                
                const reply = await message.reply({ embeds: [embed] });
                
                try {
                    const workPrompt = `
Bạn là chuyên gia tarot về sự nghiệp. Hãy luận giải 3 lá bài sau trong bối cảnh công việc và sự nghiệp:

**Công việc hiện tại:** ${cards[0].name} (${cards[0].orientation})
**Cơ hội:** ${cards[1].name} (${cards[1].orientation})
**Hướng phát triển:** ${cards[2].name} (${cards[2].orientation})

Hãy tập trung vào:
- Tình trạng công việc hiện tại
- Những cơ hội sắp tới
- Lời khuyên cho sự phát triển nghề nghiệp
- Định hướng tương lai

Viết bằng tiếng Việt, phong cách chuyên nghiệp và thực tế.`;

                    const reading = await getChatGPTReading('custom', cards, workPrompt);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('💼 Luận Bài Sự Nghiệp')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#4169E1')
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài sự nghiệp bởi AI • Hãy nỗ lực không ngừng!' });
                    
                    await reply.edit({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('Work reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI - Hiển thị ý nghĩa cơ bản')
                        .setColor('#FF0000');
                    cards.forEach((card, index) => {
                        errorEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: card.currentMeaning,
                            inline: false 
                        });
                    });
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarotmoney': {
                const cards = drawMultipleCards(3);
                const positions = ['💰 Tài Chính Hiện Tại', '📈 Đầu Tư', '🏆 Thịnh Vượng'];
                const embed = createMultiCardEmbed(cards, '🤖 AI Đang Phân Tích Tài Chính...', positions);
                
                const reply = await message.reply({ embeds: [embed] });
                
                try {
                    const moneyPrompt = `
Bạn là chuyên gia tarot về tài chính. Hãy luận giải 3 lá bài sau trong bối cảnh tiền bạc và tài chính:

**Tài chính hiện tại:** ${cards[0].name} (${cards[0].orientation})
**Đầu tư:** ${cards[1].name} (${cards[1].orientation})
**Thịnh vượng:** ${cards[2].name} (${cards[2].orientation})

Hãy tập trung vào:
- Tình trạng tài chính hiện tại
- Cơ hội đầu tư và kiếm tiền
- Lời khuyên quản lý tài chính
- Triển vọng thịnh vượng

Viết bằng tiếng Việt, phong cách thực tế và cẩn trọng.`;

                    const reading = await getChatGPTReading('custom', cards, moneyPrompt);
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('💰 Luận Bài Tài Chính')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#FFD700')
                        .setTimestamp()
                        .setFooter({ text: 'Luận bài tài chính bởi AI • Đầu tư thông minh!' });
                    
                    await reply.edit({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('Money reading error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Lỗi AI - Hiển thị ý nghĩa cơ bản')
                        .setColor('#FF0000');
                    cards.forEach((card, index) => {
                        errorEmbed.addFields({ 
                            name: `${positions[index]}: ${card.name}`, 
                            value: card.currentMeaning,
                            inline: false 
                        });
                    });
                    await reply.edit({ embeds: [errorEmbed] });
                }
                break;
            }

            case 'tarotstats': {
                const stats = await getUserStats(userId);
                const embed = new EmbedBuilder()
                    .setTitle('📊 Thống Kê Sử Dụng Của Bạn')
                    .setColor('#00CED1')
                    .setDescription(`**Ngày:** ${stats.date}`)
                    .addFields(
                        {
                            name: '🎯 Quota Bói Bài',
                            value: `**Đã dùng:** ${stats.totalTarotCommands}/3 lệnh\n**Còn lại:** ${stats.remainingQuota} lệnh`,
                            inline: true
                        },
                        {
                            name: '📈 Tổng Hoạt Động',
                            value: `**Tất cả lệnh:** ${stats.totalToday} lần\n**(Bao gồm help, stats)**`,
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Quota được reset mỗi ngày lúc 00:00 UTC+7' });

                if (Object.keys(stats.commands).length > 0) {
                    const tarotCommands = [];
                    const otherCommands = [];
                    
                    Object.entries(stats.commands).forEach(([cmd, count]) => {
                        const { TAROT_COMMANDS } = require('./antiSpam');
                        if (TAROT_COMMANDS.includes(cmd)) {
                            tarotCommands.push(`\`!${cmd}\`: ${count} lần`);
                        } else {
                            otherCommands.push(`\`!${cmd}\`: ${count} lần`);
                        }
                    });
                    
                    if (tarotCommands.length > 0) {
                        embed.addFields({ 
                            name: '🔮 Lệnh Bói Bài (Tính Vào Quota)', 
                            value: tarotCommands.join('\n'),
                            inline: false 
                        });
                    }
                    
                    if (otherCommands.length > 0) {
                        embed.addFields({ 
                            name: '🛠️ Lệnh Khác (Không Tính Quota)', 
                            value: otherCommands.join('\n'),
                            inline: false 
                        });
                    }
                } else {
                    embed.addFields({ 
                        name: '📋 Chi Tiết', 
                        value: 'Bạn chưa sử dụng lệnh nào hôm nay!',
                        inline: false 
                    });
                }

                // Hiển thị cooldown còn lại
                const activeCooldowns = [];
                const now = Date.now();
                
                for (const [cmd, cooldownTime] of Object.entries(require('./antiSpam').COOLDOWNS)) {
                    const cooldownCheck = checkCooldown(userId, cmd);
                    if (!cooldownCheck.canUse) {
                        const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000);
                        activeCooldowns.push(`\`!${cmd}\`: ${timeLeft}s`);
                    }
                }

                if (activeCooldowns.length > 0) {
                    embed.addFields({ 
                        name: '⏰ Cooldown Đang Chạy', 
                        value: activeCooldowns.join('\n'),
                        inline: false 
                    });
                }

                await message.reply({ embeds: [embed] });
                break;
            }
        }
    } catch (error) {
        console.error('❌ Lỗi khi xử lý command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Có Lỗi Xảy Ra')
            .setDescription('Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.')
            .setColor('#FF0000');

        await message.reply({ embeds: [errorEmbed] });
    }
});

// Xử lý select menu và button interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() || interaction.isButton() || interaction.isModalSubmit()) {
        try {
            const userId = interaction.user.id;
            let userSelection = userSelections.get(userId);
            
            if (!userSelection) {
                userSelection = { selectedCards: [], lastInteraction: Date.now() };
                userSelections.set(userId, userSelection);
            }
            
            // Xử lý select menu chọn loại bài
            if (interaction.customId === 'card_type_select') {
                const selectedType = interaction.values[0];
                const embed = createCardListEmbed(selectedType);
                const components = [createCardTypeSelector()];
                
                if (selectedType !== 'all') {
                    components.push(createCardSelector(selectedType, 0));
                }
                
                await interaction.update({ 
                    embeds: [embed], 
                    components 
                });
            }
            
            // Xử lý select menu chọn bài cụ thể
            else if (interaction.customId.startsWith('card_select_')) {
                const selectedCardIndex = parseInt(interaction.values[0]);
                const selectedCard = getCardByIndex(selectedCardIndex);
                
                // Thêm bài vào selection nếu chưa có
                if (!userSelection.selectedCards.find(card => card.index === selectedCardIndex)) {
                    userSelection.selectedCards.push(selectedCard);
                    userSelection.lastInteraction = Date.now();
                }
                
                const selectedEmbed = createSelectedCardsEmbed(userSelection.selectedCards);
                const actionButtons = createActionButtons(userSelection.selectedCards);
                
                await interaction.update({
                    embeds: [selectedEmbed],
                    components: [actionButtons]
                });
            }
            
            // Xử lý button actions
            else if (interaction.customId === 'reading_chatgpt') {
                if (userSelection.selectedCards.length === 0) {
                    await interaction.reply({ 
                        content: '❌ Bạn chưa chọn lá bài nào!', 
                        ephemeral: true 
                    });
                    return;
                }
                
                await interaction.reply({ 
                    content: '🤖 ChatGPT đang phân tích các lá bài của bạn...', 
                    ephemeral: false 
                });
                
                try {
                    const reading = await getChatGPTReading('custom', userSelection.selectedCards, 'Hãy luận giải các lá bài này cho tôi.');
                    
                    const readingEmbed = new EmbedBuilder()
                        .setTitle('🤖 Luận Bài Chi Tiết Từ ChatGPT')
                        .setDescription(reading.length > 4096 ? reading.substring(0, 4093) + '...' : reading)
                        .setColor('#00FF00')
                        .setTimestamp()
                        .setFooter({ text: 'Được tạo bởi ChatGPT • Chỉ mang tính tham khảo' });
                    
                    await interaction.followUp({ embeds: [readingEmbed] });
                } catch (error) {
                    console.error('ChatGPT reading error:', error);
                    await interaction.followUp({ 
                        content: '❌ Không thể kết nối đến ChatGPT. Vui lòng kiểm tra API key và thử lại.',
                        ephemeral: true 
                    });
                }
            }
            
            else if (interaction.customId === 'reading_quick') {
                if (userSelection.selectedCards.length === 0) {
                    await interaction.reply({ 
                        content: '❌ Bạn chưa chọn lá bài nào!', 
                        ephemeral: true 
                    });
                    return;
                }
                
                await interaction.reply({ content: '⚡ Đang tạo lời khuyên nhanh...', ephemeral: false });
                
                try {
                    const quickReading = await getQuickReading(userSelection.selectedCards);
                    
                    const quickEmbed = new EmbedBuilder()
                        .setTitle('⚡ Lời Khuyên Nhanh')
                        .setDescription(quickReading)
                        .setColor('#FFD700')
                        .setTimestamp();
                    
                    await interaction.followUp({ embeds: [quickEmbed] });
                } catch (error) {
                    await interaction.followUp({ 
                        content: '❌ Không thể tạo lời khuyên nhanh.',
                        ephemeral: true 
                    });
                }
            }
            
            else if (interaction.customId === 'clear_selection') {
                userSelection.selectedCards = [];
                userSelection.lastInteraction = Date.now();
                
                const embed = createCardListEmbed('all');
                const typeSelector = createCardTypeSelector();
                
                await interaction.update({
                    embeds: [embed],
                    components: [typeSelector]
                });
            }
            
            else if (interaction.customId === 'add_more_cards') {
                const embed = createCardListEmbed('all');
                const typeSelector = createCardTypeSelector();
                
                await interaction.update({
                    embeds: [embed],
                    components: [typeSelector]
                });
            }
            
        } catch (error) {
            console.error('Interaction error:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: '❌ Có lỗi xảy ra khi xử lý yêu cầu.',
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: '❌ Có lỗi xảy ra khi xử lý yêu cầu.',
                    ephemeral: true 
                });
            }
        }
    }
});

// Dọn dẹp user selections cũ (mỗi 30 phút)
setInterval(() => {
    const now = Date.now();
    for (const [userId, selection] of userSelections) {
        if (now - selection.lastInteraction > 30 * 60 * 1000) { // 30 phút
            userSelections.delete(userId);
        }
    }
}, 30 * 60 * 1000);

// Xử lý lỗi
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Đăng nhập bot
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN không được tìm thấy trong file .env');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);