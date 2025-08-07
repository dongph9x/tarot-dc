const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { data, cardKeys } = require('./cardUtils');

/**
 * Tạo embed hiển thị danh sách bài theo loại
 * @param {string} type - 'major', 'minor', hoặc 'all'
 * @returns {EmbedBuilder} Embed hiển thị danh sách
 */
function createCardListEmbed(type = 'all') {
    const embed = new EmbedBuilder()
        .setColor('#800080')
        .setTimestamp()
        .setFooter({ text: 'Tarot Bot • Chọn bài để luận giải' });

    if (type === 'major') {
        embed.setTitle('🌟 Major Arcana (22 lá bài)');
        embed.setDescription('Những lá bài chính thể hiện các bài học lớn trong cuộc sống');
        
        const majorCards = cardKeys
            .map((key, index) => ({ key, index, ...data[key] }))
            .filter(card => card.type === 'major')
            .map(card => `**${card.index}.** ${card.name}`)
            .join('\n');
            
        embed.addFields({ name: 'Danh sách bài:', value: majorCards, inline: false });
        
    } else if (type === 'minor') {
        embed.setTitle('🃏 Minor Arcana (56 lá bài)');
        embed.setDescription('Các lá bài thể hiện tình huống hàng ngày');
        
        // Chia theo bộ
        const suits = {
            'Tiền (Pentacles)': { start: 22, end: 35 },
            'Gậy (Wands)': { start: 36, end: 49 },
            'Cốc (Cups)': { start: 50, end: 63 },
            'Kiếm (Swords)': { start: 64, end: 77 }
        };
        
        Object.entries(suits).forEach(([suitName, range]) => {
            const suitCards = cardKeys
                .slice(range.start, range.end + 1)
                .map((key, i) => `**${range.start + i}.** ${data[key].name}`)
                .join('\n');
            embed.addFields({ name: suitName, value: suitCards, inline: true });
        });
        
    } else {
        embed.setTitle('🔮 Tất Cả Các Lá Bài Tarot (78 lá)');
        embed.setDescription('Chọn loại bài bạn muốn xem:');
        embed.addFields(
            { name: '🌟 Major Arcana', value: '22 lá bài chính', inline: true },
            { name: '🃏 Minor Arcana', value: '56 lá bài phụ', inline: true },
            { name: '📋 Hướng dẫn', value: 'Sử dụng menu bên dưới để chọn', inline: false }
        );
    }

    return embed;
}

/**
 * Tạo select menu cho việc chọn loại bài
 * @returns {ActionRowBuilder} Row chứa select menu
 */
function createCardTypeSelector() {
    const select = new StringSelectMenuBuilder()
        .setCustomId('card_type_select')
        .setPlaceholder('Chọn loại bài để xem...')
        .addOptions([
            {
                label: 'Major Arcana',
                description: '22 lá bài chính - Các bài học lớn',
                value: 'major',
                emoji: '🌟'
            },
            {
                label: 'Minor Arcana',  
                description: '56 lá bài phụ - Tình huống hàng ngày',
                value: 'minor',
                emoji: '🃏'
            },
            {
                label: 'Tất cả',
                description: 'Xem tổng quan 78 lá bài',
                value: 'all',
                emoji: '🔮'
            }
        ]);

    return new ActionRowBuilder().addComponents(select);
}

/**
 * Tạo select menu cho việc chọn bài cụ thể
 * @param {string} type - 'major' hoặc 'minor'
 * @param {number} page - Trang hiện tại (mỗi trang 25 bài)
 * @returns {ActionRowBuilder} Row chứa select menu
 */
function createCardSelector(type, page = 0) {
    const cardsPerPage = 25;
    let filteredCards;
    
    if (type === 'major') {
        filteredCards = cardKeys
            .map((key, index) => ({ key, index, ...data[key] }))
            .filter(card => card.type === 'major');
    } else if (type === 'minor') {
        filteredCards = cardKeys
            .map((key, index) => ({ key, index, ...data[key] }))
            .filter(card => card.type === 'minor');
    } else {
        filteredCards = cardKeys
            .map((key, index) => ({ key, index, ...data[key] }));
    }
    
    const startIndex = page * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, filteredCards.length);
    const pageCards = filteredCards.slice(startIndex, endIndex);
    
    const select = new StringSelectMenuBuilder()
        .setCustomId(`card_select_${type}_${page}`)
        .setPlaceholder(`Chọn lá bài... (${startIndex + 1}-${endIndex}/${filteredCards.length})`)
        .addOptions(
            pageCards.map(card => ({
                label: `${card.index}. ${card.name}`,
                description: card.meaning.upright.substring(0, 100),
                value: card.index.toString(),
                emoji: card.type === 'major' ? '🌟' : '🃏'
            }))
        );

    return new ActionRowBuilder().addComponents(select);
}

/**
 * Tạo buttons điều hướng cho pagination
 * @param {string} type - Loại bài
 * @param {number} currentPage - Trang hiện tại
 * @param {number} totalPages - Tổng số trang
 * @returns {ActionRowBuilder} Row chứa buttons
 */
function createPaginationButtons(type, currentPage, totalPages) {
    const buttons = [];
    
    if (currentPage > 0) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`card_page_${type}_${currentPage - 1}`)
                .setLabel('◀ Trang trước')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    buttons.push(
        new ButtonBuilder()
            .setCustomId('page_info')
            .setLabel(`Trang ${currentPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );
    
    if (currentPage < totalPages - 1) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`card_page_${type}_${currentPage + 1}`)
                .setLabel('Trang sau ▶')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    return new ActionRowBuilder().addComponents(buttons);
}

/**
 * Tạo buttons cho các hành động với bài đã chọn
 * @param {Array} selectedCards - Mảng các bài đã chọn
 * @returns {ActionRowBuilder} Row chứa buttons
 */
function createActionButtons(selectedCards) {
    const buttons = [
        new ButtonBuilder()
            .setCustomId('reading_chatgpt')
            .setLabel(`🤖 Luận bài với ChatGPT`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(selectedCards.length === 0),
        
        new ButtonBuilder()
            .setCustomId('reading_quick')
            .setLabel('⚡ Đọc nhanh')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(selectedCards.length === 0),
            
        new ButtonBuilder()
            .setCustomId('clear_selection')
            .setLabel('🗑️ Xóa lựa chọn')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(selectedCards.length === 0),
            
        new ButtonBuilder()
            .setCustomId('add_more_cards')
            .setLabel('➕ Thêm bài')
            .setStyle(ButtonStyle.Success)
            .setDisabled(selectedCards.length >= 10)
    ];
    
    return new ActionRowBuilder().addComponents(buttons);
}

/**
 * Tạo embed hiển thị các bài đã chọn
 * @param {Array} selectedCards - Mảng các bài đã chọn
 * @returns {EmbedBuilder} Embed hiển thị
 */
function createSelectedCardsEmbed(selectedCards) {
    const embed = new EmbedBuilder()
        .setTitle('🎯 Các Lá Bài Đã Chọn')
        .setColor('#FFD700')
        .setTimestamp();
        
    if (selectedCards.length === 0) {
        embed.setDescription('Chưa có lá bài nào được chọn.\nSử dụng menu bên dưới để chọn bài.');
        return embed;
    }
    
    embed.setDescription(`Đã chọn ${selectedCards.length}/10 lá bài:`);
    
    selectedCards.forEach((card, index) => {
        embed.addFields({
            name: `${index + 1}. ${card.name}`,
            value: `**Loại:** ${card.type === 'major' ? 'Major Arcana' : 'Minor Arcana'}\n**Ý nghĩa xuôi:** ${card.meaning.upright}`,
            inline: false
        });
    });
    
    embed.setFooter({ 
        text: 'Sẵn sàng luận bài? Nhấn nút "Luận bài với ChatGPT" bên dưới!' 
    });
    
    return embed;
}

/**
 * Tạo modal để nhập câu hỏi tùy chỉnh
 * @returns {Object} Modal component
 */
function createQuestionModal() {
    const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId('custom_question_modal')
        .setTitle('Đặt Câu Hỏi Cho Lá Bài');
    
    const questionInput = new TextInputBuilder()
        .setCustomId('question_input')
        .setLabel('Câu hỏi của bạn:')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ví dụ: Tình yêu của tôi sẽ như thế nào trong thời gian tới?')
        .setRequired(true)
        .setMaxLength(500);
    
    const firstActionRow = new ActionRowBuilder().addComponents(questionInput);
    modal.addComponents(firstActionRow);
    
    return modal;
}

module.exports = {
    createCardListEmbed,
    createCardTypeSelector,
    createCardSelector,
    createPaginationButtons,
    createActionButtons,
    createSelectedCardsEmbed,
    createQuestionModal
};