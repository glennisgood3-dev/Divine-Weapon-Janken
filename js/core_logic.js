/**
 * 神兵猜拳 - 核心遊戲邏輯
 * 純邏輯模組，不包含DOM操作或網路通訊
 */

const GAME_CONSTANTS = {
    INITIAL_HP: 10,
    MAX_ROUNDS: 5,
    BASE_DAMAGE: 2,
    ENHANCED_DAMAGE_BONUS: 1, // 劍派系額外傷害
    ARMOR_PROTECTION: 1
};

const CARD_TYPES = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

const FACTIONS = {
    SWORD: 'sword',
    SHIELD: 'shield',
    SPEAR: 'spear'
};

const BATTLE_RESULTS = {
    WIN: 'win',
    LOSE: 'lose',
    TIE: 'tie'
};

/**
 * 創建新的遊戲狀態
 */
function createGameState() {
    return {
        player: {
            hp: GAME_CONSTANTS.INITIAL_HP,
            armor: 0,
            faction: null,
            enhancedCard: null,
            lastRoundDamaged: false
        },
        
        opponent: {
            hp: GAME_CONSTANTS.INITIAL_HP,
            armor: 0,
            faction: null,
            enhancedCard: null,
            lastRoundDamaged: false
        },
        
        currentRound: 1,
        gamePhase: 'faction_selection', // faction_selection, enhanced_card_selection, battle, game_over
        isGameActive: false,
        winner: null,
        
        roundHistory: []
    };
}

/**
 * 設定玩家派系
 */
function setPlayerFaction(gameState, faction) {
    if (!Object.values(FACTIONS).includes(faction)) {
        throw new Error('Invalid faction');
    }
    
    gameState.player.faction = faction;
    return gameState;
}

/**
 * 設定對手派系
 */
function setOpponentFaction(gameState, faction) {
    if (!Object.values(FACTIONS).includes(faction)) {
        throw new Error('Invalid faction');
    }
    
    gameState.opponent.faction = faction;
    return gameState;
}

/**
 * 設定玩家強化卡
 */
function setPlayerEnhancedCard(gameState, cardType) {
    if (!Object.values(CARD_TYPES).includes(cardType)) {
        throw new Error('Invalid card type');
    }
    
    gameState.player.enhancedCard = cardType;
    return gameState;
}

/**
 * 設定對手強化卡
 */
function setOpponentEnhancedCard(gameState, cardType) {
    if (!Object.values(CARD_TYPES).includes(cardType)) {
        throw new Error('Invalid card type');
    }
    
    gameState.opponent.enhancedCard = cardType;
    return gameState;
}

/**
 * 開始戰鬥階段
 */
function startBattle(gameState) {
    if (!gameState.player.faction || !gameState.player.enhancedCard ||
        !gameState.opponent.faction || !gameState.opponent.enhancedCard) {
        throw new Error('Game setup incomplete');
    }
    
    gameState.gamePhase = 'battle';
    gameState.isGameActive = true;
    gameState.currentRound = 1;
    
    return gameState;
}

/**
 * 判斷基礎猜拳結果
 */
function getBasicRockPaperScissorsResult(playerCard, opponentCard) {
    if (playerCard === opponentCard) {
        return BATTLE_RESULTS.TIE;
    }
    
    const winConditions = {
        [CARD_TYPES.ROCK]: CARD_TYPES.SCISSORS,
        [CARD_TYPES.PAPER]: CARD_TYPES.ROCK,
        [CARD_TYPES.SCISSORS]: CARD_TYPES.PAPER
    };
    
    return winConditions[playerCard] === opponentCard ? BATTLE_RESULTS.WIN : BATTLE_RESULTS.LOSE;
}

/**
 * 檢查是否為強化卡對普通卡的情況
 */
function checkEnhancedCardAdvantage(playerCard, opponentCard, playerEnhanced, opponentEnhanced) {
    if (playerCard === opponentCard && playerEnhanced === playerCard && opponentEnhanced !== opponentCard) {
        return BATTLE_RESULTS.WIN;
    }
    
    if (playerCard === opponentCard && opponentEnhanced === opponentCard && playerEnhanced !== playerCard) {
        return BATTLE_RESULTS.LOSE;
    }
    
    return null; // 沒有強化卡優勢
}

/**
 * 計算傷害值
 */
function calculateDamage(attacker, isEnhancedCard, gameState) {
    let damage = GAME_CONSTANTS.BASE_DAMAGE;
    
    if (attacker.faction === FACTIONS.SWORD && isEnhancedCard) {
        damage += GAME_CONSTANTS.ENHANCED_DAMAGE_BONUS;
    }
    
    if (attacker.faction === FACTIONS.SPEAR && attacker.lastRoundDamaged) {
        damage += 1;
    }
    
    return damage;
}

/**
 * 應用傷害（考慮護甲）
 */
function applyDamage(target, damage) {
    const actualDamage = Math.max(0, damage - target.armor);
    const armorUsed = Math.min(damage, target.armor);
    
    target.hp = Math.max(0, target.hp - actualDamage);
    target.armor = Math.max(0, target.armor - armorUsed);
    target.lastRoundDamaged = actualDamage > 0;
    
    return {
        actualDamage,
        armorUsed,
        remainingHP: target.hp,
        remainingArmor: target.armor
    };
}

/**
 * 處理盾派系能力（平手時獲得護甲）
 */
function handleShieldFactionAbility(gameState, battleResult) {
    if (battleResult === BATTLE_RESULTS.TIE) {
        if (gameState.player.faction === FACTIONS.SHIELD) {
            gameState.player.armor += 1;
        }
        if (gameState.opponent.faction === FACTIONS.SHIELD) {
            gameState.opponent.armor += 1;
        }
    }
}

/**
 * 執行一回合戰鬥
 */
function playRound(gameState, playerCard, opponentCard) {
    if (!gameState.isGameActive) {
        throw new Error('Game is not active');
    }
    
    if (gameState.currentRound > GAME_CONSTANTS.MAX_ROUNDS) {
        throw new Error('Game has ended');
    }
    
    const enhancedAdvantage = checkEnhancedCardAdvantage(
        playerCard, 
        opponentCard, 
        gameState.player.enhancedCard, 
        gameState.opponent.enhancedCard
    );
    
    let battleResult;
    if (enhancedAdvantage) {
        battleResult = enhancedAdvantage;
    } else {
        battleResult = getBasicRockPaperScissorsResult(playerCard, opponentCard);
    }
    
    gameState.player.lastRoundDamaged = false;
    gameState.opponent.lastRoundDamaged = false;
    
    let playerDamageResult = null;
    let opponentDamageResult = null;
    
    if (battleResult === BATTLE_RESULTS.WIN) {
        const isPlayerUsingEnhanced = playerCard === gameState.player.enhancedCard;
        const damage = calculateDamage(gameState.player, isPlayerUsingEnhanced, gameState);
        opponentDamageResult = applyDamage(gameState.opponent, damage);
    } else if (battleResult === BATTLE_RESULTS.LOSE) {
        const isOpponentUsingEnhanced = opponentCard === gameState.opponent.enhancedCard;
        const damage = calculateDamage(gameState.opponent, isOpponentUsingEnhanced, gameState);
        playerDamageResult = applyDamage(gameState.player, damage);
    }
    
    handleShieldFactionAbility(gameState, battleResult);
    
    const roundResult = {
        round: gameState.currentRound,
        playerCard,
        opponentCard,
        battleResult,
        playerDamageResult,
        opponentDamageResult,
        playerHP: gameState.player.hp,
        opponentHP: gameState.opponent.hp,
        playerArmor: gameState.player.armor,
        opponentArmor: gameState.opponent.armor
    };
    
    gameState.roundHistory.push(roundResult);
    
    if (gameState.player.hp <= 0 || gameState.opponent.hp <= 0) {
        gameState.isGameActive = false;
        gameState.gamePhase = 'game_over';
        
        if (gameState.player.hp <= 0 && gameState.opponent.hp <= 0) {
            gameState.winner = 'tie';
        } else if (gameState.player.hp <= 0) {
            gameState.winner = 'opponent';
        } else {
            gameState.winner = 'player';
        }
    } else if (gameState.currentRound >= GAME_CONSTANTS.MAX_ROUNDS) {
        gameState.isGameActive = false;
        gameState.gamePhase = 'game_over';
        
        if (gameState.player.hp > gameState.opponent.hp) {
            gameState.winner = 'player';
        } else if (gameState.opponent.hp > gameState.player.hp) {
            gameState.winner = 'opponent';
        } else {
            gameState.winner = 'tie';
        }
    } else {
        gameState.currentRound++;
    }
    
    return {
        gameState,
        roundResult
    };
}

/**
 * 檢查遊戲是否結束
 */
function isGameOver(gameState) {
    return gameState.gamePhase === 'game_over';
}

/**
 * 獲取遊戲結果
 */
function getGameResult(gameState) {
    if (!isGameOver(gameState)) {
        return null;
    }
    
    return {
        winner: gameState.winner,
        playerFinalHP: gameState.player.hp,
        opponentFinalHP: gameState.opponent.hp,
        totalRounds: gameState.roundHistory.length,
        roundHistory: gameState.roundHistory
    };
}

/**
 * AI 決策函數
 */
function getAIChoice(gameState, difficulty = 'medium') {
    const cards = Object.values(CARD_TYPES);
    
    switch (difficulty) {
        case 'easy':
            return cards[Math.floor(Math.random() * cards.length)];
            
        case 'medium':
            if (gameState.roundHistory.length > 0) {
                const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1];
                const playerLastCard = lastRound.playerCard;
                
                if (Math.random() < 0.3) {
                    const counterCards = {
                        [CARD_TYPES.ROCK]: CARD_TYPES.PAPER,
                        [CARD_TYPES.PAPER]: CARD_TYPES.SCISSORS,
                        [CARD_TYPES.SCISSORS]: CARD_TYPES.ROCK
                    };
                    return counterCards[playerLastCard];
                }
            }
            return cards[Math.floor(Math.random() * cards.length)];
            
        case 'hard':
            if (gameState.roundHistory.length >= 2) {
                const recentRounds = gameState.roundHistory.slice(-2);
                const playerPattern = recentRounds.map(r => r.playerCard);
                
                if (playerPattern[0] === playerPattern[1]) {
                    const counterCards = {
                        [CARD_TYPES.ROCK]: CARD_TYPES.PAPER,
                        [CARD_TYPES.PAPER]: CARD_TYPES.SCISSORS,
                        [CARD_TYPES.SCISSORS]: CARD_TYPES.ROCK
                    };
                    return counterCards[playerPattern[1]];
                }
            }
            
            const enhancedCard = gameState.opponent.enhancedCard;
            const enhancedUsageCount = gameState.roundHistory.filter(r => r.opponentCard === enhancedCard).length;
            
            if (enhancedUsageCount < 2 && Math.random() < 0.4) {
                return enhancedCard;
            }
            
            return cards[Math.floor(Math.random() * cards.length)];
            
        default:
            return cards[Math.floor(Math.random() * cards.length)];
    }
}

/**
 * AI 派系選擇
 */
function getAIFactionChoice() {
    const factions = Object.values(FACTIONS);
    return factions[Math.floor(Math.random() * factions.length)];
}

/**
 * AI 強化卡選擇
 */
function getAIEnhancedCardChoice() {
    const cards = Object.values(CARD_TYPES);
    return cards[Math.floor(Math.random() * cards.length)];
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_CONSTANTS,
        CARD_TYPES,
        FACTIONS,
        BATTLE_RESULTS,
        createGameState,
        setPlayerFaction,
        setOpponentFaction,
        setPlayerEnhancedCard,
        setOpponentEnhancedCard,
        startBattle,
        playRound,
        isGameOver,
        getGameResult,
        getAIChoice,
        getAIFactionChoice,
        getAIEnhancedCardChoice
    };
}
