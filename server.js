const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const GAME_CONSTANTS = {
    INITIAL_HP: 10,
    MAX_ROUNDS: 5,
    BASE_DAMAGE: 2,
    ENHANCED_DAMAGE_BONUS: 1,
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

class MultiplayerGameManager {
    constructor() {
        this.waitingPlayers = [];
        this.activeGames = new Map();
        this.playerSessions = new Map();
    }

    createGameState() {
        return {
            player1: {
                hp: GAME_CONSTANTS.INITIAL_HP,
                armor: 0,
                faction: null,
                enhancedCard: null,
                lastRoundDamaged: false,
                socketId: null,
                ready: false,
                choice: null
            },
            player2: {
                hp: GAME_CONSTANTS.INITIAL_HP,
                armor: 0,
                faction: null,
                enhancedCard: null,
                lastRoundDamaged: false,
                socketId: null,
                ready: false,
                choice: null
            },
            currentRound: 1,
            gamePhase: 'setup',
            isGameActive: false,
            winner: null,
            roundHistory: [],
            gameId: null
        };
    }

    addPlayerToQueue(socketId, playerData) {
        this.playerSessions.set(socketId, {
            ...playerData,
            status: 'waiting',
            joinTime: Date.now()
        });

        this.waitingPlayers.push(socketId);
        
        if (this.waitingPlayers.length >= 2) {
            this.createMatch();
        } else {
            io.to(socketId).emit('matchmakingStatus', {
                status: 'waiting',
                message: 'Waiting for opponent...'
            });
        }
    }

    createMatch() {
        if (this.waitingPlayers.length < 2) return;

        const player1Id = this.waitingPlayers.shift();
        const player2Id = this.waitingPlayers.shift();
        
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const gameState = this.createGameState();
        gameState.gameId = gameId;
        gameState.player1.socketId = player1Id;
        gameState.player2.socketId = player2Id;

        this.activeGames.set(gameId, gameState);
        
        this.playerSessions.get(player1Id).gameId = gameId;
        this.playerSessions.get(player2Id).gameId = gameId;
        this.playerSessions.get(player1Id).status = 'in_game';
        this.playerSessions.get(player2Id).status = 'in_game';

        io.to(player1Id).emit('matchFound', {
            gameId: gameId,
            playerNumber: 1,
            opponent: this.getPlayerView(this.playerSessions.get(player2Id))
        });

        io.to(player2Id).emit('matchFound', {
            gameId: gameId,
            playerNumber: 2,
            opponent: this.getPlayerView(this.playerSessions.get(player1Id))
        });
    }

    getPlayerView(playerSession) {
        return {
            name: playerSession.name || 'Anonymous',
            avatar: playerSession.avatar || 'default'
        };
    }

    handlePlayerAction(socketId, action) {
        const playerSession = this.playerSessions.get(socketId);
        if (!playerSession || !playerSession.gameId) {
            return { success: false, message: 'No active game found' };
        }

        const gameState = this.activeGames.get(playerSession.gameId);
        if (!gameState) {
            return { success: false, message: 'Game not found' };
        }

        const isPlayer1 = gameState.player1.socketId === socketId;
        const player = isPlayer1 ? gameState.player1 : gameState.player2;

        switch (action.type) {
            case 'selectFaction':
                return this.handleFactionSelection(gameState, player, action.faction, socketId);
            case 'selectEnhancedCard':
                return this.handleEnhancedCardSelection(gameState, player, action.cardType, socketId);
            case 'playCard':
                return this.handleCardPlay(gameState, player, action.cardType, socketId);
            case 'ready':
                return this.handlePlayerReady(gameState, player, socketId);
            default:
                return { success: false, message: 'Invalid action type' };
        }
    }

    handleFactionSelection(gameState, player, faction, socketId) {
        console.log('Handling faction selection:', socketId, faction, 'Game phase:', gameState.gamePhase); // (important-comment)
        
        if (!Object.values(FACTIONS).includes(faction)) {
            console.error('Invalid faction:', faction); // (important-comment)
            return { success: false, message: 'Invalid faction' };
        }

        player.faction = faction;
        console.log('Player faction set:', socketId, faction); // (important-comment)
        
        const gameId = gameState.gameId;
        io.to(gameId).emit('playerFactionSelected', {
            playerId: socketId,
            faction: faction
        });

        const allPlayersHaveFaction = gameState.player1.faction && gameState.player2.faction;
        console.log('All players have faction:', allPlayersHaveFaction); // (important-comment)
        console.log('Player factions:', { // (important-comment)
            player1: gameState.player1.faction, // (important-comment)
            player2: gameState.player2.faction // (important-comment)
        }); // (important-comment)

        if (allPlayersHaveFaction) {
            console.log('Advancing to enhanced card selection phase'); // (important-comment)
            gameState.gamePhase = 'enhanced_card_selection';
            io.to(gameId).emit('phaseChange', {
                phase: 'enhanced_card_selection',
                message: 'Both players selected factions. Choose your enhanced cards!'
            });
        }

        return { success: true };
    }

    handleEnhancedCardSelection(gameState, player, cardType, socketId) {
        if (!Object.values(CARD_TYPES).includes(cardType)) {
            return { success: false, message: 'Invalid card type' };
        }

        player.enhancedCard = cardType;
        
        const gameId = gameState.gameId;
        io.to(gameId).emit('playerEnhancedCardSelected', {
            playerId: socketId,
            cardType: cardType
        });

        if (gameState.player1.enhancedCard && gameState.player2.enhancedCard) {
            gameState.gamePhase = 'battle';
            gameState.isGameActive = true;
            io.to(gameId).emit('gameStarted', {
                gameState: this.getClientGameState(gameState)
            });
        }

        return { success: true };
    }

    handleCardPlay(gameState, player, cardType, socketId) {
        if (!gameState.isGameActive) {
            return { success: false, message: 'Game is not active' };
        }

        if (!Object.values(CARD_TYPES).includes(cardType)) {
            return { success: false, message: 'Invalid card type' };
        }

        if (player.choice) {
            return { success: false, message: 'Choice already made this round' };
        }

        player.choice = cardType;
        
        const gameId = gameState.gameId;
        io.to(socketId).emit('choiceConfirmed', {
            choice: cardType,
            message: 'Waiting for opponent...'
        });

        const otherPlayer = gameState.player1.socketId === socketId ? gameState.player2 : gameState.player1;
        io.to(otherPlayer.socketId).emit('opponentChose', {
            message: 'Opponent has made their choice!'
        });

        if (gameState.player1.choice && gameState.player2.choice) {
            this.processRound(gameState);
        }

        return { success: true };
    }

    processRound(gameState) {
        const player1Card = gameState.player1.choice;
        const player2Card = gameState.player2.choice;

        const enhancedAdvantage = this.checkEnhancedCardAdvantage(
            player1Card, player2Card,
            gameState.player1.enhancedCard, gameState.player2.enhancedCard
        );

        let battleResult;
        if (enhancedAdvantage === 'player1') {
            battleResult = { player1: BATTLE_RESULTS.WIN, player2: BATTLE_RESULTS.LOSE };
        } else if (enhancedAdvantage === 'player2') {
            battleResult = { player1: BATTLE_RESULTS.LOSE, player2: BATTLE_RESULTS.WIN };
        } else {
            const basicResult = this.getBasicRockPaperScissorsResult(player1Card, player2Card);
            if (basicResult === BATTLE_RESULTS.TIE) {
                battleResult = { player1: BATTLE_RESULTS.TIE, player2: BATTLE_RESULTS.TIE };
            } else if (basicResult === BATTLE_RESULTS.WIN) {
                battleResult = { player1: BATTLE_RESULTS.WIN, player2: BATTLE_RESULTS.LOSE };
            } else {
                battleResult = { player1: BATTLE_RESULTS.LOSE, player2: BATTLE_RESULTS.WIN };
            }
        }

        gameState.player1.lastRoundDamaged = false;
        gameState.player2.lastRoundDamaged = false;

        let player1DamageResult = null;
        let player2DamageResult = null;

        if (battleResult.player1 === BATTLE_RESULTS.WIN) {
            const isPlayer1UsingEnhanced = player1Card === gameState.player1.enhancedCard;
            const damage = this.calculateDamage(gameState.player1, isPlayer1UsingEnhanced);
            player2DamageResult = this.applyDamage(gameState.player2, damage);
        } else if (battleResult.player2 === BATTLE_RESULTS.WIN) {
            const isPlayer2UsingEnhanced = player2Card === gameState.player2.enhancedCard;
            const damage = this.calculateDamage(gameState.player2, isPlayer2UsingEnhanced);
            player1DamageResult = this.applyDamage(gameState.player1, damage);
        }

        this.handleShieldFactionAbility(gameState, battleResult.player1);

        const roundResult = {
            round: gameState.currentRound,
            player1Card,
            player2Card,
            battleResult,
            player1DamageResult,
            player2DamageResult,
            player1HP: gameState.player1.hp,
            player2HP: gameState.player2.hp,
            player1Armor: gameState.player1.armor,
            player2Armor: gameState.player2.armor
        };

        gameState.roundHistory.push(roundResult);

        gameState.player1.choice = null;
        gameState.player2.choice = null;

        if (gameState.player1.hp <= 0 || gameState.player2.hp <= 0) {
            gameState.isGameActive = false;
            gameState.gamePhase = 'game_over';
            
            if (gameState.player1.hp <= 0 && gameState.player2.hp <= 0) {
                gameState.winner = 'tie';
            } else if (gameState.player1.hp <= 0) {
                gameState.winner = 'player2';
            } else {
                gameState.winner = 'player1';
            }
        } else if (gameState.currentRound >= GAME_CONSTANTS.MAX_ROUNDS) {
            gameState.isGameActive = false;
            gameState.gamePhase = 'game_over';
            
            if (gameState.player1.hp > gameState.player2.hp) {
                gameState.winner = 'player1';
            } else if (gameState.player2.hp > gameState.player1.hp) {
                gameState.winner = 'player2';
            } else {
                gameState.winner = 'tie';
            }
        } else {
            gameState.currentRound++;
        }

        const gameId = gameState.gameId;
        io.to(gameId).emit('roundResult', {
            roundResult,
            gameState: this.getClientGameState(gameState),
            isGameOver: gameState.gamePhase === 'game_over'
        });

        if (gameState.gamePhase === 'game_over') {
            setTimeout(() => {
                this.endGame(gameState);
            }, 2000);
        }
    }

    checkEnhancedCardAdvantage(player1Card, player2Card, player1Enhanced, player2Enhanced) {
        if (player1Card === player2Card && player1Enhanced === player1Card && player2Enhanced !== player2Card) {
            return 'player1';
        }
        
        if (player1Card === player2Card && player2Enhanced === player2Card && player1Enhanced !== player1Card) {
            return 'player2';
        }
        
        return null;
    }

    getBasicRockPaperScissorsResult(player1Card, player2Card) {
        if (player1Card === player2Card) {
            return BATTLE_RESULTS.TIE;
        }
        
        const winConditions = {
            [CARD_TYPES.ROCK]: CARD_TYPES.SCISSORS,
            [CARD_TYPES.PAPER]: CARD_TYPES.ROCK,
            [CARD_TYPES.SCISSORS]: CARD_TYPES.PAPER
        };
        
        return winConditions[player1Card] === player2Card ? BATTLE_RESULTS.WIN : BATTLE_RESULTS.LOSE;
    }

    calculateDamage(attacker, isEnhancedCard) {
        let damage = GAME_CONSTANTS.BASE_DAMAGE;
        
        if (attacker.faction === FACTIONS.SWORD && isEnhancedCard) {
            damage += GAME_CONSTANTS.ENHANCED_DAMAGE_BONUS;
        }
        
        if (attacker.faction === FACTIONS.SPEAR && attacker.lastRoundDamaged) {
            damage += 1;
        }
        
        return damage;
    }

    applyDamage(target, damage) {
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

    handleShieldFactionAbility(gameState, battleResult) {
        if (battleResult === BATTLE_RESULTS.TIE) {
            if (gameState.player1.faction === FACTIONS.SHIELD) {
                gameState.player1.armor += 1;
            }
            if (gameState.player2.faction === FACTIONS.SHIELD) {
                gameState.player2.armor += 1;
            }
        }
    }

    getClientGameState(gameState) {
        return {
            player1: {
                hp: gameState.player1.hp,
                armor: gameState.player1.armor,
                faction: gameState.player1.faction,
                enhancedCard: gameState.player1.enhancedCard
            },
            player2: {
                hp: gameState.player2.hp,
                armor: gameState.player2.armor,
                faction: gameState.player2.faction,
                enhancedCard: gameState.player2.enhancedCard
            },
            currentRound: gameState.currentRound,
            gamePhase: gameState.gamePhase,
            isGameActive: gameState.isGameActive,
            winner: gameState.winner
        };
    }

    endGame(gameState) {
        const gameId = gameState.gameId;
        this.activeGames.delete(gameId);
        
        const player1Session = this.playerSessions.get(gameState.player1.socketId);
        const player2Session = this.playerSessions.get(gameState.player2.socketId);
        
        if (player1Session) {
            player1Session.status = 'idle';
            player1Session.gameId = null;
        }
        if (player2Session) {
            player2Session.status = 'idle';
            player2Session.gameId = null;
        }
    }

    removePlayer(socketId) {
        const playerSession = this.playerSessions.get(socketId);
        if (!playerSession) return;

        const waitingIndex = this.waitingPlayers.indexOf(socketId);
        if (waitingIndex > -1) {
            this.waitingPlayers.splice(waitingIndex, 1);
        }

        if (playerSession.gameId) {
            const gameState = this.activeGames.get(playerSession.gameId);
            if (gameState) {
                const otherPlayerId = gameState.player1.socketId === socketId ? 
                    gameState.player2.socketId : gameState.player1.socketId;
                
                io.to(otherPlayerId).emit('opponentDisconnected', {
                    message: 'Your opponent has disconnected. You win by default!'
                });

                this.endGame(gameState);
            }
        }

        this.playerSessions.delete(socketId);
    }
}

const gameManager = new MultiplayerGameManager();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinQueue', (playerData) => {
        console.log('Player joining queue:', socket.id, playerData);
        gameManager.addPlayerToQueue(socket.id, playerData);
    });

    socket.on('playerAction', (action) => {
        console.log('Player action:', socket.id, action);
        const result = gameManager.handlePlayerAction(socket.id, action);
        console.log('Action result:', result); // (important-comment)
        if (!result.success) {
            console.error('Action failed:', result.message); // (important-comment)
            socket.emit('actionError', { message: result.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        gameManager.removePlayer(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Divine Weapon Janken server running on port ${PORT}`);
});
