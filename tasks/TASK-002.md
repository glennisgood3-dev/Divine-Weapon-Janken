# **任務編號：TASK-002**

## **任務目標 (Objective)**
優化並重構遊戲的回合結束與新回合開始之間的過渡序列，增加視覺回饋與節奏感，提升整體遊戲體驗。

---

## **核心需求 (Requirements)**

當前回合的勝負結果 (`resolveRound()` 函數) 計算完畢後，需嚴格按照以下順序執行新的動畫與邏輯流程：

**1. 顯示結果 (Display Result):**
* 在畫面中央顯示當前回合的結果橫幅 (例如，ID 為 `#result-banner` 的元素，內容為 "YOU WIN!", "YOU LOSE!", "TIE!")。
* 此橫幅應帶有醒目的發光或放大動畫，使其成為視覺焦點。

**2. 靜滯與閱讀 (Pause & Read):**
* 使用 `setTimeout` 設置一個 **2 秒** 的延遲。在此期間，結果橫幅與場上所有卡牌均保持顯示狀態，讓玩家有足夠的時間消化結果。

**3. 清理場面 (Clear the Board):**
* 2 秒延遲結束後，執行以下清理動畫：
    * 為 `#result-banner` 元素添加一個 `.fade-out` CSS class，使其平滑淡出。
    * 同時，為中央戰鬥區的雙方卡牌元素 (`#player-choice-zone > img`, `#opponent-choice-zone > img`) 同樣添加 `.fade-out` class，使其淡出。
    * 在 CSS `animationend` 事件觸發後，將這些元素的 `display` 設為 `none` 或將其從 DOM 中移除，徹底清理場面。

**4. 更新回合計數器 (Update Round Counter):**
* **必須在場面清理乾淨之後**，才更新 `gameState.round` 的計數。
* 將新的回合數更新到畫面上的回合顯示元素 (ID: `#round-counter`) 中。例如，從 "Round 2/5" 更新為 "Round 3/5"。

**5. 新回合宣告 (Announce New Round):**
* 在 HTML 中新增一個預設隱藏的全螢幕居中元素，例如 `<div id="round-start-indicator" class="hidden"></div>`。
* 更新完回合計數器後，將此元素的內容設為 "Round 3"，並移除 `.hidden` class，同時觸發一個短暫的 "淡入再淡出" (fade-in-then-out) 的動畫。
* 這個宣告動畫結束後，才顯示玩家手牌區的出牌選項，正式開始新回合。

---

## **驗收標準 (Acceptance Criteria)**
* 勝負結果橫幅能正確顯示並停留約 2 秒。
* 橫幅與場上卡牌能夠平滑淡出，而不是瞬間消失。
* 回合計數器的數字，必須在橫幅與卡牌消失**之後**才更新。
* 在出牌選項出現**之前**，能清楚看到一個 "Round X" 的新回合開始提示動畫。
* 整個過渡流程順暢，無卡頓或邏輯跳躍。

---

## **需建立/修改的文件路徑 (File Paths to Modify)**
* `/js/single_player.js`: 修改 `executeRound()` 函數的結尾，以及相關函數，以實現上述的異步流程 (async flow)。
* `/style.css`: 新增 `#result-banner`, `#round-start-indicator` 的樣式，以及 `.fade-out`, `.fade-in-then-out` 等動畫的 `@keyframes` 定義。
* `/index.html`: 在適當位置加入 `<div id="result-banner" class="hidden"></div>` 和 `<div id="round-start-indicator" class="hidden"></div>` 的 HTML 結構。
