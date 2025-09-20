/**
 * Divine Weapon Janken - Multiplayer Controller
 * Handles multiplayer UI interactions and Socket.IO communication
 */

class MultiplayerGame {
    constructor() {
        this.socket = null;
        this.gameState = null;
        this.playerNumber = null;
        this.currentScreen = 'mainMenu';
        this.selectedFaction = null;
        this.selectedEnhancedCard = null;
        this.isConnected = false;
        this.gameId = null;
        this.opponentInfo = null;
        
        this.initializeEventListeners();
        this.showScreen('mainMenu');
    }
    
    initializeEventListeners() {
        document.getElementById('multiPlayerBtn').addEventListener('click', () => {
            this.startMultiplayerGame();
        });
        
        document.querySelectorAll('.faction-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (this.isConnected && this.gameState) {
                    this.selectFaction(e.currentTarget.dataset.faction);
                }
            });
        });
        
        document.querySelectorAll('.card-grid .card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (this.isConnected && this.gameState) {
                    this.selectEnhancedCard(e.currentTarget.dataset.card);
                }
            });
        });
        
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (this.isConnected && this.gameState && this.gameState.isGameActive) {
                    this.playCard(e.currentTarget.dataset.card);
                }
            });
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.backToMainMenu();
        });
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }
    
    startMultiplayerGame() {
        this.showScreen('multiplayerWaiting');
        this.connectToServer();
    }
    
    connectToServer() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.joinQueue();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.showConnectionError();
        });
        
        this.socket.on('matchmakingStatus', (data) => {
            this.updateWaitingStatus(data);
        });
        
        this.socket.on('matchFound', (data) => {
            this.handleMatchFound(data);
        });
        
        this.socket.on('playerFactionSelected', (data) => {
            this.handleOpponentFactionSelected(data);
        });
        
        this.socket.on('playerEnhancedCardSelected', (data) => {
            this.handleOpponentEnhancedCardSelected(data);
        });
        
        this.socket.on('phaseChange', (data) => {
            this.handlePhaseChange(data);
        });
        
        this.socket.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });
        
        this.socket.on('choiceConfirmed', (data) => {
            this.handleChoiceConfirmed(data);
        });
        
        this.socket.on('opponentChose', (data) => {
            this.handleOpponentChose(data);
        });
        
        this.socket.on('roundResult', (data) => {
            this.handleRoundResult(data);
        });
        
        this.socket.on('opponentDisconnected', (data) => {
            this.handleOpponentDisconnected(data);
        });
        
        this.socket.on('actionError', (data) => {
            this.showError(data.message);
        });
    }
    
    joinQueue() {
        const playerData = {
            name: 'Player',
            avatar: 'default'
        };
        
        this.socket.emit('joinQueue', playerData);
    }
    
    updateWaitingStatus(data) {
        const waitingDiv = document.getElementById('multiplayerWaiting');
        if (waitingDiv) {
            waitingDiv.innerHTML = `
                <div class="ui-frame">
                    <h2>Multiplayer Matchmaking</h2>
                    <div class="waiting-animation">
                        <div class="spinner"></div>
                    </div>
                    <p>${data.message}</p>
                    <button onclick="multiplayerGame.backToMainMenu()" class="menu-btn secondary">Cancel</button>
                </div>
            `;
        }
    }
    
    handleMatchFound(data) {
        this.gameId = data.gameId;
        this.playerNumber = data.playerNumber;
        this.opponentInfo = data.opponent;
        
        this.showScreen('factionSelection');
        this.updateMatchInfo();
    }
    
    updateMatchInfo() {
        const matchInfo = document.createElement('div');
        matchInfo.className = 'match-info';
        matchInfo.innerHTML = `
            <div class="opponent-info-bar">
                <span>Playing against: ${this.opponentInfo.name}</span>
                <span>You are Player ${this.playerNumber}</span>
            </div>
        `;
        
        const factionScreen = document.getElementById('factionSelection');
        if (factionScreen && !factionScreen.querySelector('.match-info')) {
            factionScreen.querySelector('.ui-frame').prepend(matchInfo);
        }
    }
    
    selectFaction(faction) {
        if (!this.isConnected) return;
        
        document.querySelectorAll('.faction-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-faction="${faction}"]`).classList.add('selected');
        this.selectedFaction = faction;
        
        this.socket.emit('playerAction', {
            type: 'selectFaction',
            faction: faction
        });
    }
    
    handleOpponentFactionSelected(data) {
        if (data.playerId !== this.socket.id) {
            this.showNotification(`Opponent selected ${data.faction} faction`);
        }
    }
    
    handlePhaseChange(data) {
        if (data.phase === 'enhanced_card_selection') {
            setTimeout(() => {
                this.showScreen('enhancedCardSelection');
                this.updateMatchInfo();
            }, 1000);
        }
    }
    
    selectEnhancedCard(cardType) {
        if (!this.isConnected) return;
        
        document.querySelectorAll('.card-grid .card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-card="${cardType}"]`).classList.add('selected');
        this.selectedEnhancedCard = cardType;
        
        this.socket.emit('playerAction', {
            type: 'selectEnhancedCard',
            cardType: cardType
        });
    }
    
    handleOpponentEnhancedCardSelected(data) {
        if (data.playerId !== this.socket.id) {
            this.showNotification(`Opponent selected enhanced ${data.cardType}`);
        }
    }
    
    handleGameStarted(data) {
        this.gameState = data.gameState;
        this.showScreen('gameBattle');
        this.updateBattleUI();
        this.showNotification('Battle begins!');
    }
    
    updateBattleUI() {
        if (!this.gameState) return;
        
        const myPlayer = this.playerNumber === 1 ? this.gameState.player1 : this.gameState.player2;
        const opponent = this.playerNumber === 1 ? this.gameState.player2 : this.gameState.player1;
        
        document.getElementById('playerHP').textContent = myPlayer.hp;
        document.getElementById('playerArmor').textContent = myPlayer.armor;
        
        document.getElementById('opponentHP').textContent = opponent.hp;
        document.getElementById('opponentArmor').textContent = opponent.armor;
        
        document.getElementById('currentRound').textContent = this.gameState.currentRound;
        
        const playerFactionIcon = document.getElementById('playerFactionIcon');
        const opponentFactionIcon = document.getElementById('opponentFactionIcon');
        
        playerFactionIcon.className = `faction-icon ${myPlayer.faction}-icon`;
        opponentFactionIcon.className = `faction-icon ${opponent.faction}-icon`;
        
        const factionNames = {
            sword: 'Sword Faction',
            shield: 'Shield Faction',
            spear: 'Spear Faction'
        };
        
        const factionAbilities = {
            sword: 'Enhanced cards deal +1 extra damage',
            shield: 'Gain 1 armor when both players tie',
            spear: '+1 damage if damaged last round'
        };
        
        document.getElementById('playerFactionName').textContent = factionNames[myPlayer.faction];
        document.getElementById('playerFactionAbility').textContent = factionAbilities[myPlayer.faction];
        document.getElementById('opponentFactionName').textContent = `${this.opponentInfo.name}: ${factionNames[opponent.faction]}`;
        document.getElementById('opponentFactionAbility').textContent = factionAbilities[opponent.faction];
        
        this.updateEnhancedCardDisplay(myPlayer, opponent);
        this.resetBattleZone();
        this.enablePlayerCards();
    }
    
    updateEnhancedCardDisplay(myPlayer, opponent) {
        const playerEnhancedCard = document.getElementById('playerEnhancedCard');
        const opponentEnhancedCard = document.getElementById('opponentEnhancedCard');
        
        const playerCardIcon = playerEnhancedCard.querySelector('.card-icon') || document.createElement('div');
        playerCardIcon.className = `card-icon ${myPlayer.enhancedCard}-icon`;
        if (!playerEnhancedCard.querySelector('.card-icon')) {
            playerEnhancedCard.appendChild(playerCardIcon);
        }
        
        const opponentCardIcon = opponentEnhancedCard.querySelector('.card-icon') || document.createElement('div');
        opponentCardIcon.className = `card-icon ${opponent.enhancedCard}-icon`;
        if (!opponentEnhancedCard.querySelector('.card-icon')) {
            opponentEnhancedCard.appendChild(opponentCardIcon);
        }
    }
    
    resetBattleZone() {
        const playerSlot = document.getElementById('playerCardPlayed');
        const opponentSlot = document.getElementById('opponentCardPlayed');
        const battleResult = document.getElementById('battleResult');
        const roundSummary = document.getElementById('roundSummary');
        
        playerSlot.innerHTML = '<div class="card-placeholder">Choose your card</div>';
        opponentSlot.innerHTML = '<div class="card-placeholder">Waiting for opponent...</div>';
        battleResult.textContent = '';
        battleResult.className = 'battle-result';
        if (roundSummary) {
            roundSummary.textContent = '';
            roundSummary.className = 'round-summary';
        }
    }
    
    enablePlayerCards() {
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.classList.remove('disabled');
        });
    }
    
    disablePlayerCards() {
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.classList.add('disabled');
        });
    }
    
    playCard(cardType) {
        if (!this.isConnected || !this.gameState || !this.gameState.isGameActive) return;
        
        this.disablePlayerCards();
        this.displayPlayerCard(cardType);
        
        this.socket.emit('playerAction', {
            type: 'playCard',
            cardType: cardType
        });
    }
    
    displayPlayerCard(cardType) {
        const playerSlot = document.getElementById('playerCardPlayed');
        const myPlayer = this.playerNumber === 1 ? this.gameState.player1 : this.gameState.player2;
        const isEnhanced = cardType === myPlayer.enhancedCard;
        
        playerSlot.innerHTML = `
            <div class="card ${isEnhanced ? 'enhanced' : ''}">
                ${isEnhanced ? '<div class="enhanced-glow"></div>' : ''}
                <div class="card-icon ${cardType}-icon"></div>
                <span>${this.getCardDisplayName(cardType)}</span>
            </div>
        `;
    }
    
    displayOpponentCard(cardType) {
        const opponentSlot = document.getElementById('opponentCardPlayed');
        const opponent = this.playerNumber === 1 ? this.gameState.player2 : this.gameState.player1;
        const isEnhanced = cardType === opponent.enhancedCard;
        
        opponentSlot.innerHTML = `
            <div class="card ${isEnhanced ? 'enhanced' : ''}">
                ${isEnhanced ? '<div class="enhanced-glow"></div>' : ''}
                <div class="card-icon ${cardType}-icon"></div>
                <span>${this.getCardDisplayName(cardType)}</span>
            </div>
        `;
    }
    
    getCardDisplayName(cardType) {
        const names = {
            rock: 'Rock',
            paper: 'Paper',
            scissors: 'Scissors'
        };
        return names[cardType] || cardType;
    }
    
    handleChoiceConfirmed(data) {
        this.showNotification(data.message);
    }
    
    handleOpponentChose(data) {
        const opponentSlot = document.getElementById('opponentCardPlayed');
        opponentSlot.innerHTML = '<div class="card-placeholder">Opponent chose!</div>';
        this.showNotification(data.message);
    }
    
    handleRoundResult(data) {
        this.gameState = data.gameState;
        const roundResult = data.roundResult;
        
        const myCard = this.playerNumber === 1 ? roundResult.player1Card : roundResult.player2Card;
        const opponentCard = this.playerNumber === 1 ? roundResult.player2Card : roundResult.player1Card;
        
        this.displayOpponentCard(opponentCard);
        this.displayBattleResult(roundResult);
        this.updateBattleUI();
        
        if (data.isGameOver) {
            setTimeout(() => {
                this.showGameResult();
            }, 5000);
        } else {
            setTimeout(() => {
                this.resetBattleZone();
                this.enablePlayerCards();
            }, 5000);
        }
    }
    
    displayBattleResult(roundResult) {
        const battleResultDiv = document.getElementById('battleResult');
        const roundSummary = document.getElementById('roundSummary');
        
        const myResult = this.playerNumber === 1 ? roundResult.battleResult.player1 : roundResult.battleResult.player2;
        const myDamageResult = this.playerNumber === 1 ? roundResult.player1DamageResult : roundResult.player2DamageResult;
        const opponentDamageResult = this.playerNumber === 1 ? roundResult.player2DamageResult : roundResult.player1DamageResult;
        
        let resultText = '';
        let resultClass = '';
        let summaryText = '';
        
        switch (myResult) {
            case 'win':
                resultText = '🎉 YOU WIN! 🎉';
                resultClass = 'win';
                break;
            case 'lose':
                resultText = '💥 YOU LOSE! 💥';
                resultClass = 'lose';
                break;
            case 'tie':
                resultText = '⚖️ TIE ROUND! ⚖️';
                resultClass = 'tie';
                break;
        }
        
        if (myDamageResult) {
            summaryText += `You took ${myDamageResult.actualDamage} damage`;
            if (myDamageResult.armorUsed > 0) {
                summaryText += ` (${myDamageResult.armorUsed} blocked by armor)`;
            }
        }
        
        if (opponentDamageResult) {
            if (summaryText) summaryText += ' • ';
            summaryText += `Opponent took ${opponentDamageResult.actualDamage} damage`;
            if (opponentDamageResult.armorUsed > 0) {
                summaryText += ` (${opponentDamageResult.armorUsed} blocked by armor)`;
            }
        }
        
        battleResultDiv.textContent = resultText;
        battleResultDiv.className = `battle-result ${resultClass}`;
        
        if (roundSummary && summaryText) {
            roundSummary.textContent = summaryText;
            roundSummary.className = 'round-summary';
        }
        
        setTimeout(() => {
            battleResultDiv.classList.add('show');
        }, 200);
        
        if (roundSummary && summaryText) {
            setTimeout(() => {
                roundSummary.classList.add('show');
            }, 800);
        }
    }
    
    showGameResult() {
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        const myPlayer = this.playerNumber === 1 ? this.gameState.player1 : this.gameState.player2;
        const opponent = this.playerNumber === 1 ? this.gameState.player2 : this.gameState.player1;
        
        let winner = null;
        if (this.gameState.winner === 'tie') {
            winner = 'tie';
        } else if (this.gameState.winner === `player${this.playerNumber}`) {
            winner = 'player';
        } else {
            winner = 'opponent';
        }
        
        switch (winner) {
            case 'player':
                resultTitle.textContent = 'Victory!';
                resultMessage.textContent = 'Congratulations! You won the battle!';
                resultMessage.style.color = '#4caf50';
                break;
            case 'opponent':
                resultTitle.textContent = 'Defeat!';
                resultMessage.textContent = 'Unfortunately, you were defeated. Better luck next time!';
                resultMessage.style.color = '#f44336';
                break;
            case 'tie':
                resultTitle.textContent = 'Draw!';
                resultMessage.textContent = 'An evenly matched battle!';
                resultMessage.style.color = '#ff9800';
                break;
        }
        
        document.getElementById('finalPlayerHP').textContent = myPlayer.hp;
        document.getElementById('finalOpponentHP').textContent = opponent.hp;
        document.getElementById('totalRounds').textContent = this.gameState.currentRound - 1;
        
        this.showScreen('gameResult');
    }
    
    handleOpponentDisconnected(data) {
        this.showNotification(data.message);
        setTimeout(() => {
            this.backToMainMenu();
        }, 3000);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    showError(message) {
        console.error('Game error:', message);
        this.showNotification(`Error: ${message}`);
    }
    
    showConnectionError() {
        this.showScreen('mainMenu');
        this.showNotification('Connection lost. Please try again.');
    }
    
    restartGame() {
        this.startMultiplayerGame();
    }
    
    backToMainMenu() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.gameState = null;
        this.selectedFaction = null;
        this.selectedEnhancedCard = null;
        this.isConnected = false;
        this.gameId = null;
        this.opponentInfo = null;
        this.showScreen('mainMenu');
    }
}

let multiplayerGame;

document.addEventListener('DOMContentLoaded', () => {
    multiplayerGame = new MultiplayerGame();
});
