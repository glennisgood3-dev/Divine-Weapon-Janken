/**
 * 神兵猜拳 - 單人模式控制器
 * 處理UI互動和遊戲流程
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
        const battleResult = document.getElementById('battleResult');
        
        playerSlot.innerHTML = '<div class="card-placeholder">選擇你的卡牌</div>';
        opponentSlot.innerHTML = '<div class="card-placeholder">對手思考中...</div>';
        battleResult.textContent = '';
        battleResult.className = 'battle-result';
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
        if (!this.gameState.isGameActive) return;
        
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
            rock: '石頭',
            paper: '布',
            scissors: '剪刀'
        };
        return names[cardType] || cardType;
    }
    
    executeRound(playerCard, opponentCard) {
        const result = playRound(this.gameState, playerCard, opponentCard);
        const roundResult = result.roundResult;
        
        this.displayBattleResult(roundResult);
        
        this.updateBattleUI();
        
        if (isGameOver(this.gameState)) {
            setTimeout(() => {
                this.showGameResult();
            }, 2000);
        } else {
            setTimeout(() => {
                this.enablePlayerCards();
            }, 2000);
        }
    }
    
    displayBattleResult(roundResult) {
        const battleResultDiv = document.getElementById('battleResult');
        let resultText = '';
        let resultClass = '';
        
        switch (roundResult.battleResult) {
            case BATTLE_RESULTS.WIN:
                resultText = '你獲勝！';
                resultClass = 'win';
                break;
            case BATTLE_RESULTS.LOSE:
                resultText = '你落敗！';
                resultClass = 'lose';
                break;
            case BATTLE_RESULTS.TIE:
                resultText = '平手！';
                resultClass = 'tie';
                break;
        }
        
        if (roundResult.playerDamageResult) {
            resultText += ` 你受到 ${roundResult.playerDamageResult.actualDamage} 點傷害`;
            if (roundResult.playerDamageResult.armorUsed > 0) {
                resultText += ` (護甲抵銷 ${roundResult.playerDamageResult.armorUsed} 點)`;
            }
        }
        
        if (roundResult.opponentDamageResult) {
            resultText += ` 對手受到 ${roundResult.opponentDamageResult.actualDamage} 點傷害`;
            if (roundResult.opponentDamageResult.armorUsed > 0) {
                resultText += ` (護甲抵銷 ${roundResult.opponentDamageResult.armorUsed} 點)`;
            }
        }
        
        battleResultDiv.textContent = resultText;
        battleResultDiv.className = `battle-result ${resultClass}`;
        
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
        const gameResult = getGameResult(this.gameState);
        
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        switch (gameResult.winner) {
            case 'player':
                resultTitle.textContent = '勝利！';
                resultMessage.textContent = '恭喜你獲得勝利！';
                resultMessage.style.color = '#4caf50';
                break;
            case 'opponent':
                resultTitle.textContent = '敗北！';
                resultMessage.textContent = '很遺憾，你被擊敗了。';
                resultMessage.style.color = '#f44336';
                break;
            case 'tie':
                resultTitle.textContent = '平手！';
                resultMessage.textContent = '勢均力敵的對決！';
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
    new SinglePlayerGame();
});
