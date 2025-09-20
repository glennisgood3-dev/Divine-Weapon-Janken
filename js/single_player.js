/**
 * Divine Weapon Janken - Single Player Controller
 * Handles UI interactions and game flow
 */

class SinglePlayerGame {
    constructor() {
        this.gameState = null;
        this.currentScreen = 'mainMenu';
        this.selectedFaction = null;
        this.selectedEnhancedCard = null;
        this.aiDifficulty = 'medium';
        
        this.initializeEventListeners();
        this.showScreen('mainMenu');
    }
    
    initializeEventListeners() {
        document.getElementById('singlePlayerBtn').addEventListener('click', () => {
            this.startSinglePlayerGame();
        });
        
        document.querySelectorAll('.faction-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectFaction(e.currentTarget.dataset.faction);
            });
        });
        
        document.querySelectorAll('.card-grid .card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectEnhancedCard(e.currentTarget.dataset.card);
            });
        });
        
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.playCard(e.currentTarget.dataset.card);
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
    
    startSinglePlayerGame() {
        this.gameState = createGameState();
        this.selectedFaction = null;
        this.selectedEnhancedCard = null;
        
        this.removeMultiplayerEventListeners();
        
        this.showScreen('factionSelection');
    }
    
    removeMultiplayerEventListeners() {
        document.querySelectorAll('.player-hand .card').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.playCard(e.currentTarget.dataset.card);
            });
        });
        
        document.querySelectorAll('.faction-card').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        document.querySelectorAll('.faction-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectFaction(e.currentTarget.dataset.faction);
            });
        });
        
        document.querySelectorAll('.card-grid .card').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        document.querySelectorAll('.card-grid .card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectEnhancedCard(e.currentTarget.dataset.card);
            });
        });
    }
    
    selectFaction(faction) {
        document.querySelectorAll('.faction-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-faction="${faction}"]`).classList.add('selected');
        this.selectedFaction = faction;
        
        setTimeout(() => {
            this.proceedToEnhancedCardSelection();
        }, 500);
    }
    
    proceedToEnhancedCardSelection() {
        if (!this.selectedFaction) return;
        
        setPlayerFaction(this.gameState, this.selectedFaction);
        
        const aiFaction = getAIFactionChoice();
        setOpponentFaction(this.gameState, aiFaction);
        
        this.showScreen('enhancedCardSelection');
    }
    
    selectEnhancedCard(cardType) {
        document.querySelectorAll('.card-grid .card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-card="${cardType}"]`).classList.add('selected');
        this.selectedEnhancedCard = cardType;
        
        setTimeout(() => {
            this.proceedToBattle();
        }, 500);
    }
    
    proceedToBattle() {
        if (!this.selectedEnhancedCard) return;
        
        setPlayerEnhancedCard(this.gameState, this.selectedEnhancedCard);
        
        const aiEnhancedCard = getAIEnhancedCardChoice();
        setOpponentEnhancedCard(this.gameState, aiEnhancedCard);
        
        startBattle(this.gameState);
        
        this.showScreen('gameBattle');
        this.updateBattleUI();
    }
    
    updateBattleUI() {
        document.getElementById('playerHP').textContent = this.gameState.player.hp;
        document.getElementById('playerArmor').textContent = this.gameState.player.armor;
        
        document.getElementById('opponentHP').textContent = this.gameState.opponent.hp;
        document.getElementById('opponentArmor').textContent = this.gameState.opponent.armor;
        
        document.getElementById('currentRound').textContent = this.gameState.currentRound;
        
        const playerFactionIcon = document.getElementById('playerFactionIcon');
        const opponentFactionIcon = document.getElementById('opponentFactionIcon');
        
        playerFactionIcon.className = `faction-icon ${this.gameState.player.faction}-icon`;
        opponentFactionIcon.className = `faction-icon ${this.gameState.opponent.faction}-icon`;
        
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
        
        document.getElementById('playerFactionName').textContent = factionNames[this.gameState.player.faction];
        document.getElementById('playerFactionAbility').textContent = factionAbilities[this.gameState.player.faction];
        document.getElementById('opponentFactionName').textContent = `AI: ${factionNames[this.gameState.opponent.faction]}`;
        document.getElementById('opponentFactionAbility').textContent = factionAbilities[this.gameState.opponent.faction];
        
        this.updateEnhancedCardDisplay();
        
        this.resetBattleZone();
        
        this.enablePlayerCards();
    }
    
    updateEnhancedCardDisplay() {
        const playerEnhancedCard = document.getElementById('playerEnhancedCard');
        const opponentEnhancedCard = document.getElementById('opponentEnhancedCard');
        
        const playerCardIcon = playerEnhancedCard.querySelector('.card-icon') || document.createElement('div');
        playerCardIcon.className = `card-icon ${this.gameState.player.enhancedCard}-icon`;
        if (!playerEnhancedCard.querySelector('.card-icon')) {
            playerEnhancedCard.appendChild(playerCardIcon);
        }
        
        const opponentCardIcon = opponentEnhancedCard.querySelector('.card-icon') || document.createElement('div');
        opponentCardIcon.className = `card-icon ${this.gameState.opponent.enhancedCard}-icon`;
        if (!opponentEnhancedCard.querySelector('.card-icon')) {
            opponentEnhancedCard.appendChild(opponentCardIcon);
        }
    }
    
    initializeBattleLog() {
        const battleLog = document.getElementById('battleLog');
        battleLog.innerHTML = '<div class="battle-log-placeholder">戰鬥記錄將在這裡顯示...</div>';
    }
    
    addBattleLogEntry(roundResult) {
        const battleLog = document.getElementById('battleLog');
        
        if (!battleLog) {
            return;
        }
        
        const placeholder = battleLog.querySelector('.battle-log-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = 'battle-log-entry';
        
        const cardNames = {
            rock: '石頭',
            paper: '布',
            scissors: '剪刀'
        };
        
        const playerCardName = cardNames[roundResult.playerCard];
        const opponentCardName = cardNames[roundResult.opponentCard];
        const playerEnhanced = roundResult.playerCard === this.gameState.player.enhancedCard ? ' (強化)' : '';
        const opponentEnhanced = roundResult.opponentCard === this.gameState.opponent.enhancedCard ? ' (強化)' : '';
        
        let resultText = '';
        let resultClass = '';
        switch (roundResult.battleResult) {
            case 'win':
                resultText = '你獲勝！';
                resultClass = 'win';
                break;
            case 'lose':
                resultText = '你失敗！';
                resultClass = 'lose';
                break;
            case 'tie':
                resultText = '平手！';
                resultClass = 'tie';
                break;
        }
        
        let damageText = '';
        if (roundResult.playerDamageResult && roundResult.playerDamageResult.actualDamage > 0) {
            damageText += `你受到 ${roundResult.playerDamageResult.actualDamage} 點傷害`;
            if (roundResult.playerDamageResult.armorUsed > 0) {
                damageText += ` (護甲抵擋 ${roundResult.playerDamageResult.armorUsed} 點)`;
            }
        }
        if (roundResult.opponentDamageResult && roundResult.opponentDamageResult.actualDamage > 0) {
            if (damageText) damageText += ' • ';
            damageText += `對手受到 ${roundResult.opponentDamageResult.actualDamage} 點傷害`;
            if (roundResult.opponentDamageResult.armorUsed > 0) {
                damageText += ` (護甲抵擋 ${roundResult.opponentDamageResult.armorUsed} 點)`;
            }
        }
        if (!damageText) {
            damageText = '無傷害';
        }
        
        if (roundResult.battleResult === 'tie') {
            if (this.gameState.player.faction === 'shield') {
                damageText += ' • 你獲得 1 點護甲';
            }
            if (this.gameState.opponent.faction === 'shield') {
                damageText += ' • 對手獲得 1 點護甲';
            }
        }
        
        logEntry.innerHTML = `
            <div class="log-round-header">第 ${roundResult.round} 回合</div>
            <div class="log-choices">
                <span>你: ${playerCardName}${playerEnhanced}</span>
                <span>對手: ${opponentCardName}${opponentEnhanced}</span>
            </div>
            <div class="log-result ${resultClass}">${resultText}</div>
            <div class="log-damage">${damageText}</div>
            <div class="log-damage">血量: 你 ${roundResult.playerHP} • 對手 ${roundResult.opponentHP}</div>
        `;
        
        battleLog.insertBefore(logEntry, battleLog.firstChild);
        
        const entries = battleLog.querySelectorAll('.battle-log-entry');
        if (entries.length > 5) {
            entries[entries.length - 1].remove();
        }
        
        battleLog.scrollTop = 0;
    }
    
    resetBattleZone() {
        const playerSlot = document.getElementById('playerCardPlayed');
        const opponentSlot = document.getElementById('opponentCardPlayed');
        const battleResult = document.getElementById('battleResult');
        const roundSummary = document.getElementById('roundSummary');
        
        playerSlot.innerHTML = '<div class="card-placeholder">Choose your card</div>';
        opponentSlot.innerHTML = '<div class="card-placeholder">Opponent thinking...</div>';
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
        if (!this.gameState.isGameActive) {
            return;
        }
        
        this.disablePlayerCards();
        
        this.displayPlayerCard(cardType);
        
        const aiCard = getAIChoice(this.gameState, this.aiDifficulty);
        
        setTimeout(() => {
            this.displayOpponentCard(aiCard);
            
            setTimeout(() => {
                this.executeRound(cardType, aiCard);
            }, 500);
        }, 1000);
    }
    
    displayPlayerCard(cardType) {
        const playerSlot = document.getElementById('playerCardPlayed');
        const isEnhanced = cardType === this.gameState.player.enhancedCard;
        
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
        const isEnhanced = cardType === this.gameState.opponent.enhancedCard;
        
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
    
    executeRound(playerCard, opponentCard) {
        const result = playRound(this.gameState, playerCard, opponentCard);
        const roundResult = result.roundResult;
        
        this.displayBattleResult(roundResult);
        this.addBattleLogEntry(roundResult);
        
        this.updateBattleUI();
        
        if (isGameOver(this.gameState)) {
            setTimeout(() => {
                this.showGameResult();
            }, 2000);
        } else {
            setTimeout(() => {
                this.resetBattleZone();
                this.enablePlayerCards();
            }, 2000);
        }
    }
    
    displayBattleResult(roundResult) {
        const battleResultDiv = document.getElementById('battleResult');
        const roundSummary = document.getElementById('roundSummary');
        let resultText = '';
        let resultClass = '';
        let summaryText = '';
        
        switch (roundResult.battleResult) {
            case BATTLE_RESULTS.WIN:
                resultText = '🎉 YOU WIN! 🎉';
                resultClass = 'win';
                break;
            case BATTLE_RESULTS.LOSE:
                resultText = '💥 YOU LOSE! 💥';
                resultClass = 'lose';
                break;
            case BATTLE_RESULTS.TIE:
                resultText = '⚖️ TIE ROUND! ⚖️';
                resultClass = 'tie';
                break;
        }
        
        if (roundResult.playerDamageResult) {
            summaryText += `You took ${roundResult.playerDamageResult.actualDamage} damage`;
            if (roundResult.playerDamageResult.armorUsed > 0) {
                summaryText += ` (${roundResult.playerDamageResult.armorUsed} blocked by armor)`;
            }
        }
        
        if (roundResult.opponentDamageResult) {
            if (summaryText) summaryText += ' • ';
            summaryText += `Opponent took ${roundResult.opponentDamageResult.actualDamage} damage`;
            if (roundResult.opponentDamageResult.armorUsed > 0) {
                summaryText += ` (${roundResult.opponentDamageResult.armorUsed} blocked by armor)`;
            }
        }
        
        if (roundResult.battleResult === BATTLE_RESULTS.TIE && this.gameState.player.faction === FACTIONS.SHIELD) {
            if (summaryText) summaryText += ' • ';
            summaryText += 'Shield ability: +1 armor gained!';
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
        
        this.addVisualEffects(roundResult);
    }
    
    addVisualEffects(roundResult) {
        if (roundResult.playerDamageResult && roundResult.playerDamageResult.actualDamage > 0) {
            document.querySelector('.player-info').classList.add('damage-flash');
            setTimeout(() => {
                document.querySelector('.player-info').classList.remove('damage-flash');
            }, 500);
        }
        
        if (roundResult.opponentDamageResult && roundResult.opponentDamageResult.actualDamage > 0) {
            document.querySelector('.opponent-info').classList.add('damage-flash');
            setTimeout(() => {
                document.querySelector('.opponent-info').classList.remove('damage-flash');
            }, 500);
        }
        
        if (roundResult.battleResult === BATTLE_RESULTS.TIE) {
            if (this.gameState.player.faction === FACTIONS.SHIELD) {
                document.querySelector('.player-info').classList.add('heal-flash');
                setTimeout(() => {
                    document.querySelector('.player-info').classList.remove('heal-flash');
                }, 500);
            }
            
            if (this.gameState.opponent.faction === FACTIONS.SHIELD) {
                document.querySelector('.opponent-info').classList.add('heal-flash');
                setTimeout(() => {
                    document.querySelector('.opponent-info').classList.remove('heal-flash');
                }, 500);
            }
        }
    }
    
    showGameResult() {
        console.log('Showing game result screen'); // (important-comment)
        const gameResult = getGameResult(this.gameState);
        console.log('Game result data:', gameResult); // (important-comment)
        
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        console.log('Result title element:', resultTitle); // (important-comment)
        console.log('Result message element:', resultMessage); // (important-comment)
        
        if (!resultTitle || !resultMessage) {
            console.error('Result elements not found!'); // (important-comment)
            return;
        }
        
        switch (gameResult.winner) {
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
            default:
                console.error('Unknown game result winner:', gameResult.winner); // (important-comment)
                resultTitle.textContent = 'Game Over';
                resultMessage.textContent = 'The battle has ended.';
                resultMessage.style.color = '#ffffff';
        }
        
        const finalPlayerHP = document.getElementById('finalPlayerHP');
        const finalOpponentHP = document.getElementById('finalOpponentHP');
        const totalRounds = document.getElementById('totalRounds');
        
        if (finalPlayerHP) finalPlayerHP.textContent = gameResult.playerFinalHP;
        if (finalOpponentHP) finalOpponentHP.textContent = gameResult.opponentFinalHP;
        if (totalRounds) totalRounds.textContent = gameResult.totalRounds;
        
        console.log('Set result title to:', resultTitle.textContent); // (important-comment)
        console.log('Set result message to:', resultMessage.textContent); // (important-comment)
        
        this.showScreen('gameResult');
    }
    
    restartGame() {
        this.startSinglePlayerGame();
    }
    
    backToMainMenu() {
        this.gameState = null;
        this.selectedFaction = null;
        this.selectedEnhancedCard = null;
        this.showScreen('mainMenu');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SinglePlayerGame();
});
