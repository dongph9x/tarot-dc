const { data } = require('./card.js');

// Tạo mảng các key cards theo thứ tự index (0-77)
const cardKeys = [
    // Major Arcana (0-21)
    'the_fool', 'the_magician', 'the_high_priestess', 'the_empress', 'the_emperor',
    'the_hierophant', 'the_lovers', 'the_chariot', 'strength', 'the_hermit',
    'wheel_of_fortune', 'justice', 'the_hanged_man', 'death', 'temperance',
    'the_devil', 'the_tower', 'the_star', 'the_moon', 'the_sun',
    'judgement', 'the_world',
    
    // Minor Arcana - Pentacles (22-35)
    'ace_of_pentacles', 'two_of_pentacles', 'three_of_pentacles', 'four_of_pentacles',
    'five_of_pentacles', 'six_of_pentacles', 'seven_of_pentacles', 'eight_of_pentacles',
    'nine_of_pentacles', 'ten_of_pentacles', 'page_of_pentacles', 'knight_of_pentacles',
    'queen_of_pentacles', 'king_of_pentacles',
    
    // Minor Arcana - Wands (36-49)
    'ace_of_wands', 'two_of_wands', 'three_of_wands', 'four_of_wands',
    'five_of_wands', 'six_of_wands', 'seven_of_wands', 'eight_of_wands',
    'nine_of_wands', 'ten_of_wands', 'page_of_wands', 'knight_of_wands',
    'queen_of_wands', 'king_of_wands',
    
    // Minor Arcana - Cups (50-63)
    'ace_of_cups', 'two_of_cups', 'three_of_cups', 'four_of_cups',
    'five_of_cups', 'six_of_cups', 'seven_of_cups', 'eight_of_cups',
    'nine_of_cups', 'ten_of_cups', 'page_of_cups', 'knight_of_cups',
    'queen_of_cups', 'king_of_cups',
    
    // Minor Arcana - Swords (64-77)
    'ace_of_swords', 'two_of_swords', 'three_of_swords', 'four_of_swords',
    'five_of_swords', 'six_of_swords', 'seven_of_swords', 'eight_of_swords',
    'nine_of_swords', 'ten_of_swords', 'page_of_swords', 'knight_of_swords',
    'queen_of_swords', 'king_of_swords'
];

/**
 * Lấy thông tin bài tarot theo index
 * @param {number} index - Index của bài (0-77)
 * @returns {Object} Thông tin bài tarot
 */
function getCardByIndex(index) {
    if (index < 0 || index >= cardKeys.length) {
        throw new Error(`Invalid card index: ${index}. Must be between 0 and ${cardKeys.length - 1}`);
    }
    
    const cardKey = cardKeys[index];
    const cardData = data[cardKey];
    
    if (!cardData) {
        throw new Error(`Card data not found for key: ${cardKey} at index ${index}`);
    }
    
    return {
        index,
        key: cardKey,
        name: cardData.name,
        type: cardData.type,
        meaning: cardData.meaning,
        imagePath: `rwsa/${String(index).padStart(2, '0')}.webp`
    };
}

/**
 * Rút ngẫu nhiên một lá bài
 * @returns {Object} Thông tin bài được rút
 */
function drawRandomCard() {
    const randomIndex = Math.floor(Math.random() * cardKeys.length);
    const card = getCardByIndex(randomIndex);
    
    // Ngẫu nhiên xác định bài xuôi hay ngược (50/50)
    const isReversed = Math.random() < 0.5;
    
    return {
        ...card,
        isReversed,
        currentMeaning: isReversed ? card.meaning.reversed : card.meaning.upright,
        orientation: isReversed ? 'Ngược' : 'Xuôi'
    };
}

/**
 * Rút nhiều lá bài không trùng lặp
 * @param {number} count - Số lượng bài cần rút
 * @returns {Array} Mảng các bài được rút
 */
function drawMultipleCards(count) {
    if (count > cardKeys.length) {
        throw new Error(`Cannot draw ${count} cards. Maximum is ${cardKeys.length}`);
    }
    
    const drawnIndexes = [];
    const cards = [];
    
    while (cards.length < count) {
        const randomIndex = Math.floor(Math.random() * cardKeys.length);
        
        if (!drawnIndexes.includes(randomIndex)) {
            drawnIndexes.push(randomIndex);
            const card = getCardByIndex(randomIndex);
            
            // Ngẫu nhiên xác định bài xuôi hay ngược
            const isReversed = Math.random() < 0.5;
            
            cards.push({
                ...card,
                isReversed,
                currentMeaning: isReversed ? card.meaning.reversed : card.meaning.upright,
                orientation: isReversed ? 'Ngược' : 'Xuôi'
            });
        }
    }
    
    return cards;
}

/**
 * Lấy tất cả các bài theo loại
 * @param {string} type - 'major' hoặc 'minor'
 * @returns {Array} Mảng các bài thuộc loại đó
 */
function getCardsByType(type) {
    return cardKeys
        .map((key, index) => ({ key, index, ...data[key] }))
        .filter(card => card.type === type);
}

/**
 * Tìm kiếm bài theo tên
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {Array} Mảng các bài phù hợp
 */
function searchCards(searchTerm) {
    const term = searchTerm.toLowerCase();
    return cardKeys
        .map((key, index) => ({ key, index, ...data[key] }))
        .filter(card => 
            card.name.toLowerCase().includes(term) ||
            card.meaning.upright.toLowerCase().includes(term) ||
            card.meaning.reversed.toLowerCase().includes(term)
        );
}

module.exports = {
    cardKeys,
    data,
    getCardByIndex,
    drawRandomCard,
    drawMultipleCards,
    getCardsByType,
    searchCards
};