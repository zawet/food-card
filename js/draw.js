// 美食抽卡应用
class FoodGacha {
    constructor() {
        this.foods = [];
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
        this.drawBtnHot = document.getElementById('drawBtnHot');
        this.rotationLayer = document.getElementById('rotationLayer');
        this.rotationCarousel = document.getElementById('rotationCarousel');
        
        // 初始化
        this.init();
    }

    async init() {
        await this.loadFoods();
        this.bindEvents();
    }

    async loadFoods() {
        try {
            const response = await fetch('data/foods.json');
            this.foods = await response.json();
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
        this.drawBtnHot.addEventListener('click', () => this.drawCard(true));
    }

    async drawCard(isHot = false) {
        if (this.isDrawing) return;

        this.isDrawing = true;
        this.drawBtn.disabled = true;
        if (this.drawBtnHot) this.drawBtnHot.disabled = true;

        // 根据模式筛选美食
        let availableFoods;
        if (isHot) {
            // 只抽取网红打卡点
            availableFoods = this.foods.filter(food => food.category === '中山网红打卡点');
        } else {
            availableFoods = this.foods;
        }

        // 随机选择美食
        const randomIndex = Math.floor(Math.random() * availableFoods.length);
        const selectedFood = availableFoods[randomIndex];
        const rarity = this.getRarity(selectedFood);

        // 1. 隐藏当前卡片
        this.foodCard.classList.remove('show');
        this.foodCard.classList.add('hidden');

        // 等待隐藏动画完成
        await this.delay(100);

        // 2. 创建3D旋转卡片
        this.createRotationCards(selectedFood,availableFoods);

        // 3. 显示旋转层并开始动画
        this.showRotationLayer();

        // 4. 等待旋转动画完成
        await this.delay(3000);

        // 5. 隐藏旋转层
        this.hideRotationLayer();

        // 6. 等待旋转层消失
        await this.delay(500);

        // 7. 更新并显示新卡片
        this.updateCard(selectedFood, rarity);
        this.foodCard.classList.remove('hidden');
        this.foodCard.classList.add('show');

        // 8. 保存抽卡记录
        this.saveRecord(selectedFood, rarity);

        this.isDrawing = false;
        this.drawBtn.disabled = false;
        if (this.drawBtnHot) this.drawBtnHot.disabled = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    playFlash() {
        return new Promise(resolve => {
            this.flashOverlay.classList.remove('active');
            void this.flashOverlay.offsetWidth;
            this.flashOverlay.classList.add('active');
            
            setTimeout(resolve, 600);
        });
    }

    updateCard(food, rarity) {
        this.foodEmoji.textContent = food.emoji || '🍽️';
        this.foodName.textContent = food.name;
        this.foodCategory.textContent = `${food.category} · ${food.region || ''}`;
        this.foodDescription.textContent = food.description || '';

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

        this.foodCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic');
        this.foodCard.classList.add(`rarity-${rarity}`);
    }

    createRotationCards(selectedFood,foods) {
        // 清空现有旋转卡片
        this.rotationCarousel.innerHTML = '';

        // 随机选择4-6个美食进行旋转展示，减少数量增加间隙
        const cardCount = Math.floor(Math.random() * 3) + 4;
        const shuffled = [...foods].sort(() => Math.random() - 0.5);
        let selectedFoods = shuffled.slice(0, cardCount);

        // 确保抽中的美食在旋转卡片中
        if (!selectedFoods.includes(selectedFood)) {
            selectedFoods[Math.floor(Math.random() * selectedFoods.length)] = selectedFood;
        }

        // 旋转木马半径，增加半径让卡片分布更宽
        const radius = 280;

        // 创建旋转卡片
        selectedFoods.forEach((food, index) => {
            const rarity = this.getRarity(food);
            const card = document.createElement('div');

            // 给抽中的卡片添加特殊样式
            if (food === selectedFood) {
                card.className = `rotation-card rarity-${rarity}`;
            } else {
                card.className = `rotation-card rarity-${rarity}`;
            }

            card.innerHTML = `
                <div class="emoji">${food.emoji}</div>
                <div class="food-info">${food.name}</div>
            `;

            // 计算每张卡片在旋转木马上的角度
            const angle = (index / cardCount) * 360;

            // 使用3D transform让卡片围绕中心点分布
            card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;

            this.rotationCarousel.appendChild(card);
        });
    }

    showRotationLayer() {
        // 强制重绘以确保动画能重新触发
        this.rotationLayer.style.opacity = '0';
        this.rotationCarousel.style.transform = '';
        void this.rotationLayer.offsetWidth;
        this.rotationLayer.classList.add('active');
        this.rotationLayer.style.opacity = '1';
    }

    hideRotationLayer() {
        this.rotationLayer.classList.add('fade-out');
        // 动画结束后清理类名，为下次使用做准备
        setTimeout(() => {
            this.rotationLayer.classList.remove('active', 'fade-out');
            this.rotationLayer.style.opacity = '';
            this.rotationCarousel.style.transform = '';
        }, 500);
    }

    getRarity(food) {
        // 使用已有的稀有度
        if (food.rarity) return food.rarity;

        if (food.category === '中山美食' || food.category === '广州美食') {
            return Math.random() > 0.5 ? 'epic' : 'rare';
        }
        const rand = Math.random();
        if (rand > 0.85) return 'rare';
        if (rand > 0.7) return 'epic';
        return 'common';
    }

    // 保存抽卡记录到 localStorage
    saveRecord(food, rarity) {
        const record = {
            id: Date.now(),
            time: new Date().toISOString(),
            food: {
                id: food.id,
                name: food.name,
                emoji: food.emoji,
                category: food.category,
                region: food.region,
                description: food.description
            },
            rarity: rarity
        };
        
        let records = this.getRecords();
        records.unshift(record);
        
        if (records.length > 100) {
            records = records.slice(0, 100);
        }
        
        localStorage.setItem('food_gacha_records', JSON.stringify(records));
    }

    getRecords() {
        const data = localStorage.getItem('food_gacha_records');
        return data ? JSON.parse(data) : [];
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new FoodGacha();
});
