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
        this.showScreen('factionSelection');
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
    
    resetBattleZone() {
        const playerSlot = document.getElementById('playerCardPlayed');
        const opponentSlot = document.getElementById('opponentCardPlayed');
        
        playerSlot.innerHTML = '<div class="card-placeholder">Choose your card</div>';
        opponentSlot.innerHTML = '<div class="card-placeholder">Opponent thinking...</div>';
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
        console.log('=== DEBUG: playCard called ===');
        console.log('cardType:', cardType);
        console.log('gameState.isGameActive:', this.gameState.isGameActive);
        
        if (!this.gameState.isGameActive) {
            console.log('DEBUG: Game not active, returning early');
            return;
        }
        
        this.disablePlayerCards();
        
        this.displayPlayerCard(cardType);
        
        const aiCard = getAIChoice(this.gameState, this.aiDifficulty);
        console.log('DEBUG: AI chose card:', aiCard);
        
        setTimeout(() => {
            console.log('DEBUG: About to display opponent card');
            this.displayOpponentCard(aiCard);
            
            setTimeout(() => {
                console.log('DEBUG: About to call executeRound');
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
        console.log('=== DEBUG: executeRound called ===');
        console.log('playerCard:', playerCard);
        console.log('opponentCard:', opponentCard);
        console.log('gameState before playRound:', this.gameState);
        
        try {
            const result = playRound(this.gameState, playerCard, opponentCard);
            console.log('DEBUG: playRound result:', result);
            
            const roundResult = result.roundResult;
            console.log('DEBUG: roundResult extracted:', roundResult);
            
            this.displayBattleResult(roundResult);
            
            this.updateBattleUI();
            
            if (isGameOver(this.gameState)) {
                setTimeout(() => {
                    this.showGameResult();
                }, 6000);
            } else {
                setTimeout(() => {
                    this.resetBattleZone();
                    this.enablePlayerCards();
                }, 6000);
            }
        } catch (error) {
            console.error('DEBUG: Error in executeRound:', error);
            console.error('DEBUG: Error stack:', error.stack);
        }
    }
    
    displayBattleResult(roundResult) {
        console.log('=== DEBUG: displayBattleResult called ===');
        console.log('roundResult:', roundResult);
        console.log('roundResult.battleResult:', roundResult.battleResult);
        console.log('typeof roundResult.battleResult:', typeof roundResult.battleResult);
        
        const battleResultDiv = document.getElementById('battleResult');
        const roundSummary = document.getElementById('roundSummary');
        let resultText = '';
        let resultClass = '';
        let summaryText = '';
        
        console.log('battleResultDiv element:', battleResultDiv);
        
        switch (roundResult.battleResult) {
            case 'win':
                resultText = '🎉 YOU WIN! 🎉';
                resultClass = 'win';
                console.log('DEBUG: Matched WIN case');
                break;
            case 'lose':
                resultText = '💥 YOU LOSE! 💥';
                resultClass = 'lose';
                console.log('DEBUG: Matched LOSE case');
                break;
            case 'tie':
                resultText = '⚖️ TIE ROUND! ⚖️';
                resultClass = 'tie';
                console.log('DEBUG: Matched TIE case');
                break;
            default:
                console.log('DEBUG: NO CASE MATCHED! battleResult value:', roundResult.battleResult);
                resultText = 'UNKNOWN RESULT';
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
        
        if (roundResult.battleResult === 'tie' && this.gameState.player.faction === 'shield') {
            if (summaryText) summaryText += ' • ';
            summaryText += 'Shield ability: +1 armor gained!';
        }
        
        console.log('DEBUG: Setting battle result text:', resultText);
        console.log('DEBUG: Setting battle result class:', `battle-result ${resultClass}`);
        
        battleResultDiv.textContent = resultText;
        battleResultDiv.className = `battle-result ${resultClass}`;
        
        console.log('DEBUG: After setting - textContent:', battleResultDiv.textContent);
        console.log('DEBUG: After setting - className:', battleResultDiv.className);
        
        if (roundSummary && summaryText) {
            roundSummary.textContent = summaryText;
            roundSummary.className = 'round-summary';
        }
        
        console.log('DEBUG: Adding show class immediately');
        battleResultDiv.classList.add('show');
        console.log('DEBUG: Final className after show:', battleResultDiv.className);
        
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(battleResultDiv);
            console.log('DEBUG: Final computed opacity:', computedStyle.opacity);
            console.log('DEBUG: Final computed transform:', computedStyle.transform);
        }, 100);
        
        if (roundSummary && summaryText) {
            setTimeout(() => {
                roundSummary.classList.add('show');
            }, 800);
        }
        
        setTimeout(() => {
            battleResultDiv.textContent = '';
            battleResultDiv.className = 'battle-result';
            if (roundSummary) {
                roundSummary.textContent = '';
                roundSummary.className = 'round-summary';
            }
        }, 8000);
        
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
        
        if (roundResult.battleResult === 'tie') {
            if (this.gameState.player.faction === 'shield') {
                document.querySelector('.player-info').classList.add('heal-flash');
                setTimeout(() => {
                    document.querySelector('.player-info').classList.remove('heal-flash');
                }, 500);
            }
            
            if (this.gameState.opponent.faction === 'shield') {
                document.querySelector('.opponent-info').classList.add('heal-flash');
                setTimeout(() => {
                    document.querySelector('.opponent-info').classList.remove('heal-flash');
                }, 500);
            }
        }
    }
    
    showGameResult() {
        const gameResult = getGameResult(this.gameState);
        
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
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
        }
        
        document.getElementById('finalPlayerHP').textContent = gameResult.playerFinalHP;
        document.getElementById('finalOpponentHP').textContent = gameResult.opponentFinalHP;
        document.getElementById('totalRounds').textContent = gameResult.totalRounds;
        
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
    window.game = new SinglePlayerGame();
});
