import AppConfig from '../config.js';

// 美食抽卡应用
class FoodGacha {
    constructor() {
        this.foods = [];
        this.history = [];
        this.isDrawing = false;
        
        // DOM元素
        this.foodCard = document.getElementById('foodCard');
        this.foodEmoji = document.getElementById('foodEmoji');
        this.foodName = document.getElementById('foodName');
        this.foodCategory = document.getElementById('foodCategory');
        this.foodDescription = document.getElementById('foodDescription');
        this.foodRarity = document.getElementById('foodRarity');
        this.foodTags = document.getElementById('foodTags');
        this.flashOverlay = document.getElementById('flashOverlay');
        this.drawBtn = document.getElementById('drawBtn');
        this.slotReel = document.getElementById('slotReel');
        this.slotMachine = document.getElementById('slotMachine');
        this.historyList = document.getElementById('historyList');
        
        // 初始化
        this.init();
    }

    async init() {
        await this.loadFoods();
        this.bindEvents();
        this.updateSlotReel();
    }

    async loadFoods() {
        try {
            const response = await fetch('data/foods.json');
            const foods = await response.json();
            this.foods = foods.map(item => ({
                ...item,
                foodImage: item.foodImage
                    ? AppConfig.foodImageBaseUrl + item.foodImage
                    : item.foodImage,
            }));
        } catch (error) {
            console.error('加载美食数据失败:', error);
            this.foods = this.getBackupFoods();
        }
    }

    getBackupFoods() {
        return [
            { id: 1, name: '红烧肉', category: '家常菜', emoji: '🥩', color: '#8B4513' },
            { id: 2, name: '糖醋排骨', category: '家常菜', emoji: '🦴', color: '#D2691E' },
            { id: 3, name: '宫保鸡丁', category: '家常菜', emoji: '🍗', color: '#FF8C00' }
        ];
    }

    bindEvents() {
        this.drawBtn.addEventListener('click', () => this.drawCard());
    }

    updateSlotReel() {
        const emojis = this.foods.slice(0, 5).map(f => f.emoji || '🍽️');
        this.slotReel.innerHTML = emojis.map(e => `<span>${e}</span>`).join('');
    }

    async drawCard() {
        if (this.isDrawing) return;
        
        this.isDrawing = true;
        this.drawBtn.disabled = true;
        
        // 1. 老虎机滚动
        await this.slotSpin();
        
        // 2. 随机选择美食
        const randomIndex = Math.floor(Math.random() * this.foods.length);
        const selectedFood = this.foods[randomIndex];
        const rarity = this.getRarity(selectedFood);
        
        // 3. 先隐藏当前卡片
        this.foodCard.classList.remove('show');
        this.foodCard.classList.add('hidden');
        
        // 等待隐藏动画
        await this.delay(100);
        
        // 4. 播放闪光动画
        await this.playFlash();
        
        // 5. 更新卡片内容
        this.updateCard(selectedFood, rarity);
        
        // 6. 显示新卡片
        this.foodCard.classList.remove('hidden');
        this.foodCard.classList.add('show');
        
        // 7. 添加到历史记录
        this.addToHistory(selectedFood);
        
        this.isDrawing = false;
        this.drawBtn.disabled = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    slotSpin() {
        return new Promise(resolve => {
            this.slotMachine.classList.add('spinning');
            
            let spinCount = 0;
            const maxSpins = 15;
            
            const spin = () => {
                spinCount++;
                
                // 随机显示emoji
                const randomEmojis = [];
                for (let i = 0; i < 3; i++) {
                    const randomFood = this.foods[Math.floor(Math.random() * this.foods.length)];
                    randomEmojis.push(randomFood.emoji || '🍽️');
                }
                this.slotReel.innerHTML = randomEmojis.map(e => `<span>${e}</span>`).join('');
                
                if (spinCount < maxSpins) {
                    setTimeout(spin, 80 - (spinCount * 4));
                } else {
                    this.slotMachine.classList.remove('spinning');
                    resolve();
                }
            };
            
            spin();
        });
    }

    playFlash() {
        return new Promise(resolve => {
            // 触发闪光动画
            this.flashOverlay.classList.remove('active');
            // 强制重绘
            void this.flashOverlay.offsetWidth;
            this.flashOverlay.classList.add('active');
            
            // 闪光动画时长
            setTimeout(resolve, 600);
        });
    }

    updateCard(food, rarity) {
        // 更新内容
        this.foodEmoji.textContent = food.emoji || '🍽️';
        this.foodName.textContent = food.name;
        this.foodCategory.textContent = `${food.category} · ${food.region}`;
        this.foodDescription.textContent = food.description;

        // 稀有度文字
        const rarityText = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗'
        };
        this.foodRarity.textContent = rarityText[rarity];

        // 显示标签（网红打卡点类别显示标签）
        if (food.category === '中山网红打卡点' && food.tags && food.tags.length > 0) {
            this.foodTags.innerHTML = food.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        } else {
            this.foodTags.innerHTML = '';
        }

        // 设置稀有度样式
        this.foodCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic');
        this.foodCard.classList.add(`rarity-${rarity}`);
    }

    getRarity(food) {
        // 中山美食稀有度更高
        if (food.category === '中山美食') {
            return Math.random() > 0.5 ? 'epic' : 'rare';
        }
        const rand = Math.random();
        if (rand > 0.85) return 'rare';
        if (rand > 0.7) return 'epic';
        return 'common';
    }

    addToHistory(food) {
        this.history.unshift(food);
        
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = this.history.map((food, index) => `
            <div class="history-item" style="animation-delay: ${index * 0.05}s">
                <span class="history-emoji">${food.emoji || '🍽️'}</span>
                <span class="history-name">${food.name}</span>
            </div>
        `).join('');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new FoodGacha();
});
