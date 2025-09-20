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
        
        this.attachPlayerCardListeners();
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.backToMainMenu();
        });
    }
    
    attachPlayerCardListeners() {
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.replaceWith(card.cloneNode(true));
        });
        
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('Card clicked:', e.currentTarget.dataset.card);
                this.playCard(e.currentTarget.dataset.card);
            });
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
        
        document.getElementById('round-counter').textContent = this.gameState.currentRound;
        
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
        console.log('=== DEBUG: resetBattleZone called ===');
        const playerSlot = document.getElementById('playerCardPlayed');
        const opponentSlot = document.getElementById('opponentCardPlayed');
        const roundSummary = document.getElementById('roundSummary');
        
        playerSlot.innerHTML = '<div class="card-placeholder">Choose your card</div>';
        opponentSlot.innerHTML = '<div class="card-placeholder">Opponent thinking...</div>';
        
        if (roundSummary && roundSummary.classList.contains('show')) {
            roundSummary.classList.remove('show');
            setTimeout(() => {
                roundSummary.textContent = '';
                roundSummary.className = 'round-summary';
            }, 500);
        } else if (roundSummary) {
            roundSummary.textContent = '';
            roundSummary.className = 'round-summary';
        }
    }
    
    enablePlayerCards() {
        document.querySelectorAll('.player-hand .card').forEach(card => {
            card.classList.remove('disabled');
        });
        this.attachPlayerCardListeners();
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
        
        if (this.roundTimeout) {
            console.log('DEBUG: Clearing existing round timeout');
            clearTimeout(this.roundTimeout);
            this.roundTimeout = null;
        }
        
        try {
            const result = playRound(this.gameState, playerCard, opponentCard);
            console.log('DEBUG: playRound result:', result);
            
            const roundResult = result.roundResult;
            console.log('DEBUG: roundResult extracted:', roundResult);
            
            this.displayResultBanner(roundResult);
            
            this.updateBattleUIWithoutRoundCounter();
            
            setTimeout(() => {
                this.clearBoardWithAnimation(() => {
                    if (isGameOver(this.gameState)) {
                        this.showGameResult();
                    } else {
                        this.updateRoundCounter();
                        
                        this.announceNewRound(() => {
                            this.enablePlayerCards();
                        });
                    }
                });
            }, 2000);
            
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
        console.log('BEFORE setting - textContent:', battleResultDiv.textContent);
        console.log('BEFORE setting - className:', battleResultDiv.className);
        
        if (this.battleResultTimeout) {
            clearTimeout(this.battleResultTimeout);
            this.battleResultTimeout = null;
        }
        
        if (!this.battleResultObserver) {
            this.battleResultObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        console.log('MUTATION: className changed from', mutation.oldValue, 'to', battleResultDiv.className);
                    }
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        console.log('MUTATION: textContent changed to', battleResultDiv.textContent);
                    }
                });
            });
            this.battleResultObserver.observe(battleResultDiv, {
                attributes: true,
                attributeOldValue: true,
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
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
        
        battleResultDiv.offsetHeight;
        
        console.log('DEBUG: Adding show class immediately');
        battleResultDiv.classList.add('show');
        console.log('DEBUG: Final className after show:', battleResultDiv.className);
        
        setTimeout(() => {
            console.log('DEBUG: State after 50ms - textContent:', battleResultDiv.textContent, 'className:', battleResultDiv.className);
            const computedStyle = window.getComputedStyle(battleResultDiv);
            console.log('DEBUG: Computed opacity after 50ms:', computedStyle.opacity);
            console.log('DEBUG: Computed transform after 50ms:', computedStyle.transform);
        }, 50);
        
        setTimeout(() => {
            console.log('DEBUG: State after 100ms - textContent:', battleResultDiv.textContent, 'className:', battleResultDiv.className);
            const computedStyle = window.getComputedStyle(battleResultDiv);
            console.log('DEBUG: Final computed opacity:', computedStyle.opacity);
            console.log('DEBUG: Final computed transform:', computedStyle.transform);
        }, 100);
        
        setTimeout(() => {
            console.log('DEBUG: State after 500ms - textContent:', battleResultDiv.textContent, 'className:', battleResultDiv.className);
        }, 500);
        
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
    
    showNextRoundIndicator() {
        const battleResultDiv = document.getElementById('battleResult');
        const currentRound = this.gameState.currentRound;
        const maxRounds = 5;
        
        if (currentRound <= maxRounds) {
            console.log('DEBUG: Showing round start indicator for round', currentRound);
            
            battleResultDiv.classList.remove('show');
            setTimeout(() => {
                battleResultDiv.textContent = `🎯 ROUND ${currentRound} START! 🎯`;
                battleResultDiv.className = 'battle-result round-start';
                battleResultDiv.classList.add('show');
                
                setTimeout(() => {
                    battleResultDiv.classList.remove('show');
                    setTimeout(() => {
                        battleResultDiv.textContent = '';
                        battleResultDiv.className = 'battle-result';
                        console.log('DEBUG: Round start indicator cleared');
                    }, 500);
                }, 2500);
            }, 500);
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
    
    displayResultBanner(roundResult) {
        const resultBanner = document.getElementById('result-banner');
        let resultText = '';
        let resultClass = '';
        
        switch (roundResult.battleResult) {
            case 'win':
                resultText = '🎉 YOU WIN! 🎉';
                resultClass = 'win';
                break;
            case 'lose':
                resultText = '💥 YOU LOSE! 💥';
                resultClass = 'lose';
                break;
            case 'tie':
                resultText = '⚖️ TIE! ⚖️';
                resultClass = 'tie';
                break;
        }
        
        resultBanner.textContent = resultText;
        resultBanner.className = `result-banner ${resultClass}`;
        resultBanner.classList.remove('hidden');
        
        this.addVisualEffects(roundResult);
    }
    
    clearBoardWithAnimation(callback) {
        const resultBanner = document.getElementById('result-banner');
        const playerCard = document.getElementById('playerCardPlayed');
        const opponentCard = document.getElementById('opponentCardPlayed');
        
        resultBanner.classList.add('fade-out');
        playerCard.classList.add('fade-out');
        opponentCard.classList.add('fade-out');
        
        setTimeout(() => {
            resultBanner.classList.add('hidden');
            resultBanner.classList.remove('fade-out');
            resultBanner.className = 'hidden';
            
            this.resetBattleZone();
            
            playerCard.classList.remove('fade-out');
            opponentCard.classList.remove('fade-out');
            
            callback();
        }, 500); // Match CSS animation duration
    }
    
    updateBattleUIWithoutRoundCounter() {
        document.getElementById('playerHP').textContent = this.gameState.player.hp;
        document.getElementById('playerArmor').textContent = this.gameState.player.armor;
        document.getElementById('opponentHP').textContent = this.gameState.opponent.hp;
        document.getElementById('opponentArmor').textContent = this.gameState.opponent.armor;
        
        const playerFactionIcon = document.getElementById('playerFactionIcon');
        const opponentFactionIcon = document.getElementById('opponentFactionIcon');
        
        const factionNames = {
            sword: 'Sword Faction',
            shield: 'Shield Faction',
            spear: 'Spear Faction'
        };
        
        const factionAbilities = {
            sword: '《Relentless Strike》: Enhanced cards deal +1 extra damage',
            shield: '《Unbreakable Defense》: Gain 1 armor when both players tie',
            spear: '《Vengeful Counter》: +1 damage this round if damaged last round'
        };
        
        playerFactionIcon.className = `faction-icon ${this.gameState.player.faction}-icon`;
        opponentFactionIcon.className = `faction-icon ${this.gameState.opponent.faction}-icon`;
        
        document.getElementById('playerFactionName').textContent = factionNames[this.gameState.player.faction];
        document.getElementById('playerFactionAbility').textContent = factionAbilities[this.gameState.player.faction];
        document.getElementById('opponentFactionName').textContent = factionNames[this.gameState.opponent.faction];
        document.getElementById('opponentFactionAbility').textContent = factionAbilities[this.gameState.opponent.faction];
        
        this.updateEnhancedCardDisplay();
    }
    
    updateRoundCounter() {
        document.getElementById('round-counter').textContent = this.gameState.currentRound;
    }
    
    announceNewRound(callback) {
        const roundIndicator = document.getElementById('round-start-indicator');
        roundIndicator.textContent = `🎯 ROUND ${this.gameState.currentRound} START! 🎯`;
        roundIndicator.classList.remove('hidden');
        roundIndicator.classList.add('fade-in-then-out');
        
        setTimeout(() => {
            roundIndicator.classList.add('hidden');
            roundIndicator.classList.remove('fade-in-then-out');
            callback();
        }, 2000); // Match CSS animation duration
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
