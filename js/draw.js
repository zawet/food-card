import AppConfig from '../config.js';

// 品牌英文名映射
const BRAND_EN = {
    '霸王茶姬': 'ChaPanda',
    '喜茶': 'HEYTEA',
    '奈雪的茶': 'Nayuki',
    '古茗': 'Gumii',
    '茶百道': 'ChaBaiDao',
    '蜜雪冰城': 'MIXUE',
    '沪上阿姨': 'Auntie Hu',
    '爷爷不泡茶': 'TeaGramps',
    '一点点': 'Yidiandian',
    '乐乐茶': 'Lelecha',
    '茶颜悦色': 'ChayanyueseⒸ',
    '察理王子': 'Charlie',
    '粮仓': 'Granary',
    '窦柠柠檬茶': 'Douning',
    'Vinko小厨': 'Vinko',
    '珍珠公': 'Pearl Duke',
    '808Bass咖啡': '808Bass',
};

// 美食抽卡应用
class FoodGacha {
    constructor() {
        this.foods = [];
        this.drinks = [];
        this.shops = [];
        this.isDrawing = false;
        this._switching = false;
        this.currentType = 'food'; // food, drink, hot

        // DOM元素
        this.foodCard = document.getElementById('foodCard');
        this.foodImageWrap = document.getElementById('foodImageWrap');
        this.foodImage = document.getElementById('foodImage');
        this.foodEmoji = document.getElementById('foodEmoji');
        this.foodBrandLogo = document.getElementById('foodBrandLogo');
        this.foodName = document.getElementById('foodName');
        this.foodCategory = document.getElementById('foodCategory');
        this.foodDistrict = document.getElementById('foodDistrict');
        this.foodDescription = document.getElementById('foodDescription');
        this.foodRarity = document.getElementById('foodRarity');
        this.foodTags = document.getElementById('foodTags');
        this.flashOverlay = document.getElementById('flashOverlay');
        this.drawBtn = document.getElementById('drawBtn');
        this.rotationLayer = document.getElementById('rotationLayer');
        this.rotationCarousel = document.getElementById('rotationCarousel');
        this.mainTitle = document.getElementById('mainTitle');
        this.pageIndicator = document.getElementById('pageIndicator');
        this.drawArea = document.getElementById('drawArea');

        // 触摸滑动相关
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this._mouseDown = false;

        // 初始化
        this.init();
    }

    async init() {
        await this.loadData();
        this.bindEvents();
        this.updatePageIndicator();
        this.resetCard();
    }

    async loadData() {
        try {
            // 加载美食数据
            const foodResponse = await fetch('data/foods.json');
            const foods = await foodResponse.json();
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

        try {
            // 加载饮品数据
            const drinkResponse = await fetch('data/drinks.json');
            this.drinks = await drinkResponse.json();
        } catch (error) {
            console.error('加载饮品数据失败:', error);
            this.drinks = [];
        }

        try {
            // 加载网红打卡点数据
            const shopResponse = await fetch('data/shops.json');
            this.shops = await shopResponse.json();
        } catch (error) {
            console.error('加载打卡点数据失败:', error);
            this.shops = [];
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

        // 触摸滑动事件 —— 监听整个页面，任意位置均可滑动
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });

        // 鼠标拖动事件（桌面端）
        document.addEventListener('mousedown', (e) => {
            this.touchStartX = e.screenX;
            this.touchStartY = e.screenY;
            this._mouseDown = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (!this._mouseDown) return;
            this._mouseDown = false;
            this.touchEndX = e.screenX;
            this.touchEndY = e.screenY;
            this.handleSwipe();
        });

        // 点击指示器切换
        const types = ['food', 'drink', 'hot'];
        this.pageIndicator.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const targetType = dot.dataset.type;
                const currentIdx = types.indexOf(this.currentType);
                const targetIdx  = types.indexOf(targetType);
                const direction  = targetIdx > currentIdx ? 'left' : 'right';
                this.switchType(targetType, direction);
            });
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diffX = this.touchStartX - this.touchEndX;
        const diffY = Math.abs((this.touchStartY || 0) - (this.touchEndY || 0));

        // 竖向位移超过横向时视为滚动，不切换卡池
        if (diffY > Math.abs(diffX)) return;

        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                this.switchToNext(); // 左滑 → 下一个
            } else {
                this.switchToPrev(); // 右滑 → 上一个
            }
        }
    }

    switchToNext() {
        const types = ['food', 'drink', 'hot'];
        const currentIndex = types.indexOf(this.currentType);
        const nextIndex = (currentIndex + 1) % types.length;
        this.switchType(types[nextIndex], 'left');
    }

    switchToPrev() {
        const types = ['food', 'drink', 'hot'];
        const currentIndex = types.indexOf(this.currentType);
        const prevIndex = (currentIndex - 1 + types.length) % types.length;
        this.switchType(types[prevIndex], 'right');
    }

    switchType(type, direction = 'left') {
        if (this.currentType === type || this._switching) return;
        this._switching = true;

        const flipOut = direction === 'left' ? 'flip-out-left' : 'flip-out-right';
        const flipIn  = direction === 'left' ? 'flip-in-right' : 'flip-in-left';

        // 第一阶段：当前卡片向手势方向飞出翻滚（280ms）
        this.foodCard.classList.add(flipOut);

        setTimeout(() => {
            // 飞出完成，切换内容
            this.foodCard.classList.remove(flipOut);
            this.currentType = type;
            this.updatePageIndicator();
            this.resetCard();

            // 第二阶段：新内容从对面飞滚入（320ms）
            this.foodCard.classList.add(flipIn);
            setTimeout(() => {
                this.foodCard.classList.remove(flipIn);
                this._switching = false;
            }, 320);
        }, 280);
    }

    updatePageIndicator() {
        this.pageIndicator.querySelectorAll('.dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.type === this.currentType);
        });

        // 更新标题
        const titles = {
            'food': '今天吃什么呢？',
            'drink': '今天喝什么呢？',
            'hot': '今天打啥卡？'
        };
        this.mainTitle.textContent = titles[this.currentType];
    }

    resetCard() {
        this.foodCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic');

        const defaults = {
            'food': {
                emoji: '🍽️',
                name: '准备好抽卡了吗？',
                category: '点击下方按钮开始',
                description: '今天吃什么是世纪难题？<br/>让抽卡来决定！'
            },
            'drink': {
                emoji: '🧋',
                name: '准备好抽饮品了吗？',
                category: '点击下方按钮开始',
                description: '今天喝什么？<br/>奶茶、咖啡、柠檬茶任你选！'
            },
            'hot': {
                emoji: '📸',
                name: '准备好打卡了吗？',
                category: '点击下方按钮开始',
                description: '中山网红打卡点<br/>发现城市好去处！'
            }
        };

        const def = defaults[this.currentType];
        this.foodEmoji.textContent = def.emoji;
        // 无图时退回大 emoji 模式
        this.foodImageWrap.classList.add('no-image');
        this.foodImage.src = '';
        this.foodBrandLogo.style.display = 'none';
        this.foodBrandLogo.innerHTML = '';
        this.foodName.textContent = def.name;
        this.foodCategory.textContent = def.category;
        this.foodDistrict.textContent = '';
        this.foodDescription.innerHTML = def.description;
        this.foodRarity.textContent = '';
        this.foodTags.innerHTML = '';
    }

    async drawCard() {
        if (this.isDrawing) return;

        this.isDrawing = true;
        this.drawBtn.disabled = true;

        // 根据当前类型获取数据
        let availableItems;
        if (this.currentType === 'food') {
            availableItems = this.foods;
        } else if (this.currentType === 'drink') {
            availableItems = this.drinks;
        } else {
            // hot - 网红打卡点
            availableItems = this.shops;
        }

        if (availableItems.length === 0) {
            this.isDrawing = false;
            this.drawBtn.disabled = false;
            return;
        }

        // 随机选择
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const selectedItem = availableItems[randomIndex];
        const rarity = this.getRarity(selectedItem);

        // 1. 隐藏当前卡片
        this.foodCard.classList.remove('show');
        this.foodCard.classList.add('hidden');

        await this.delay(100);

        // 2. 创建3D旋转卡片
        this.createRotationCards(selectedItem, availableItems);

        // 3. 显示旋转层并开始动画
        this.showRotationLayer();

        // 4. 等待旋转动画完成
        await this.delay(3000);

        // 5. 隐藏旋转层
        this.hideRotationLayer();

        // 6. 等待旋转层消失
        await this.delay(500);

        // 7. 更新并显示新卡片
        this.updateCard(selectedItem, rarity);
        this.foodCard.classList.remove('hidden');
        this.foodCard.classList.add('show');

        // 8. 保存抽卡记录
        this.saveRecord(selectedItem, rarity);

        this.isDrawing = false;
        this.drawBtn.disabled = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateCard(item, rarity) {
        // 判断是饮品还是美食
        const isDrink = this.currentType === 'drink';

        if (isDrink) {
            // 饮品：大 emoji 主视觉（no-image 模式），brand logo 作为小角标
            this.foodImageWrap.classList.add('no-image');
            this.foodImage.src = '';
            this.foodEmoji.textContent = item.emoji || '🧋';

            if (item.brandLogo) {
                const brandEn = BRAND_EN[item.brand] || item.brand || 'Logo';
                this.foodBrandLogo.style.display = 'flex';
                this.foodBrandLogo.innerHTML = `
                    <img src="${item.brandLogo}" alt="${item.brand}"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <span class="brand-logo-fallback" style="display:none">${brandEn}</span>
                `;
            } else {
                this.foodBrandLogo.style.display = 'none';
                this.foodBrandLogo.innerHTML = '';
            }
        } else if (item.foodImage) {
            // 美食有原神图片：显示图片 + emoji 角标
            this.foodBrandLogo.style.display = 'none';
            this.foodBrandLogo.innerHTML = '';
            this.foodImageWrap.classList.remove('no-image');
            this.foodImage.src = item.foodImage;
            this.foodImage.alt = item.name;
            this.foodEmoji.textContent = item.emoji || '🍽️';
        } else {
            // 无图：大 emoji 模式
            this.foodBrandLogo.style.display = 'none';
            this.foodBrandLogo.innerHTML = '';
            this.foodImageWrap.classList.add('no-image');
            this.foodImage.src = '';
            this.foodEmoji.textContent = item.emoji || (isDrink ? '🧋' : '🍽️');
        }

        this.foodName.textContent = item.name;

        // 分类显示
        if (isDrink) {
            this.foodCategory.textContent = `${item.brand || '饮品'} · ${item.price ? item.price + '元' : ''}`;
        } else {
            this.foodCategory.textContent = `${item.category} · ${item.region || ''}`;
        }

        // 商圈名（饮品显示区域+商圈）
        if (isDrink && item.region) {
            this.foodDistrict.textContent = `${item.region} · ${item.district || ''}`;
        } else {
            this.foodDistrict.textContent = '';
        }

        this.foodDescription.textContent = item.description || '';

        const rarityText = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗'
        };
        this.foodRarity.textContent = rarityText[rarity];

        // 显示标签
        if (item.tags && item.tags.length > 0) {
            this.foodTags.innerHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        } else {
            this.foodTags.innerHTML = '';
        }

        this.foodCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic');
        this.foodCard.classList.add(`rarity-${rarity}`);
    }

    createRotationCards(selectedItem, items) {
        this.rotationCarousel.innerHTML = '';

        const cardCount = Math.floor(Math.random() * 3) + 4;
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        let selectedItems = shuffled.slice(0, cardCount);

        if (!selectedItems.includes(selectedItem)) {
            selectedItems[Math.floor(Math.random() * selectedItems.length)] = selectedItem;
        }

        const radius = 280;

        selectedItems.forEach((item, index) => {
            const rarity = this.getRarity(item);
            const card = document.createElement('div');
            card.className = `rotation-card rarity-${rarity}`;

            const isDrink = this.currentType === 'drink';
            const itemEmoji = item.emoji ;
            const displayContent = 
            // isDrink && item.brandLogo
            // ? `<img src="${item.brandLogo}" 
            // style="width: 60px; height: 60px; object-fit: contain;" 
            // onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
            // <div style="display:none; font-size: 60px;">${itemEmoji}</div>`
            // : 
            `<div class="emoji">${itemEmoji}</div>`;

            card.innerHTML = `
                ${displayContent}
                <div class="food-info">${item.name}</div>
            `;

            const angle = (index / cardCount) * 360;
            card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;

            this.rotationCarousel.appendChild(card);
        });
    }

    showRotationLayer() {
        this.rotationLayer.style.opacity = '0';
        this.rotationCarousel.style.transform = '';
        void this.rotationLayer.offsetWidth;
        this.rotationLayer.classList.add('active');
        this.rotationLayer.style.opacity = '1';
    }

    hideRotationLayer() {
        this.rotationLayer.classList.add('fade-out');
        setTimeout(() => {
            this.rotationLayer.classList.remove('active', 'fade-out');
            this.rotationLayer.style.opacity = '';
            this.rotationCarousel.style.transform = '';
        }, 500);
    }

    getRarity(item) {
        if (item.rarity) return item.rarity;

        if (item.category === '中山美食' || item.category === '广州美食') {
            return Math.random() > 0.5 ? 'epic' : 'rare';
        }
        const rand = Math.random();
        if (rand > 0.85) return 'rare';
        if (rand > 0.7) return 'epic';
        return 'common';
    }

    saveRecord(item, rarity) {
        const record = {
            id: Date.now(),
            time: new Date().toISOString(),
            type: this.currentType,
            item: {
                id: item.id,
                name: item.name,
                emoji: item.emoji,
                category: item.category,
                region: item.region,
                description: item.description,
                brand: item.brand,
                district: item.district,
                foodImage: item.foodImage || null
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
