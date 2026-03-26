import AppConfig from '../config.js';

// 全部美食卡片页面
class AllCards {
    constructor() {
        this.foods = [];
        this.currentFilter = 'all';
        this.records = [];

        // DOM元素
        this.epicGrid = document.getElementById('epicGrid');
        this.rareGrid = document.getElementById('rareGrid');
        this.commonGrid = document.getElementById('commonGrid');
        this.hotGrid = document.getElementById('hotGrid');
        this.tabBtns = document.querySelectorAll('.tab-btn');

        // 统计元素
        this.epicCount = document.getElementById('epicCount');
        this.rareCount = document.getElementById('rareCount');
        this.commonCount = document.getElementById('commonCount');
        this.hotCount = document.getElementById('hotCount');
        this.totalCount = document.getElementById('totalCount');
        this.epicStat = document.getElementById('epicStat');
        this.rareStat = document.getElementById('rareStat');
        this.commonStat = document.getElementById('commonStat');
        this.hotStat = document.getElementById('hotStat');

        // 区域元素
        this.epicSection = document.getElementById('epicSection');
        this.rareSection = document.getElementById('rareSection');
        this.commonSection = document.getElementById('commonSection');
        this.hotSection = document.getElementById('hotSection');

        // 弹窗元素
        this.cardModal = document.getElementById('cardModal');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalClose = document.getElementById('modalClose');

        this.init();
    }

    async init() {
        await this.loadFoods();
        this.loadRecords();
        this.bindEvents();
        this.renderCards();
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
            this.foods = [];
        }
    }

    loadRecords() {
        const data = localStorage.getItem('food_gacha_records');
        this.records = data ? JSON.parse(data) : [];
    }

    getDrawCount(foodName) {
        return this.records.filter(r => r.food && r.food.name === foodName).length;
    }

    bindEvents() {
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.rarity;
                this.filterCards();
            });
        });

        // 弹窗关闭事件
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalBackdrop.addEventListener('click', () => this.closeModal());

        // 卡片点击事件（使用事件委托）
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.food-card-mini');
            if (card) {
                const foodName = card.dataset.name;
                const food = this.foods.find(f => f.name === foodName);
                if (food) {
                    this.showModal(food);
                }
            }
        });
    }

    showModal(food) {
        const rarityText = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗'
        };

        const drawCount = this.getDrawCount(food.name);

        document.getElementById('modalEmoji').textContent = food.emoji || '🍽️';
        document.getElementById('modalName').textContent = food.name;
        document.getElementById('modalCategory').textContent = `${food.category} · ${food.region}`;
        document.getElementById('modalDescription').textContent = food.description || '';
        document.getElementById('modalRarity').textContent = rarityText[food.rarity];
        document.getElementById('drawCount').textContent = drawCount;

        // 显示标签
        const tagsContainer = document.getElementById('modalTags');
        if (food.category === '中山网红打卡点' && food.tags && food.tags.length > 0) {
            tagsContainer.innerHTML = food.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('');
        } else {
            tagsContainer.innerHTML = '';
        }

        // 设置稀有度样式
        const modalCard = document.getElementById('modalCard');
        modalCard.className = 'modal-card rarity-' + food.rarity;

        // 显示弹窗
        this.cardModal.classList.add('active');
    }

    closeModal() {
        this.cardModal.classList.remove('active');
    }

    filterCards() {
        // 隐藏所有区域
        this.epicSection.classList.add('hidden');
        this.rareSection.classList.add('hidden');
        this.commonSection.classList.add('hidden');
        this.hotSection.classList.add('hidden');

        // 根据筛选显示
        switch(this.currentFilter) {
            case 'all':
                this.epicSection.classList.remove('hidden');
                this.rareSection.classList.remove('hidden');
                this.commonSection.classList.remove('hidden');
                this.hotSection.classList.remove('hidden');
                break;
            case 'hot':
                this.hotSection.classList.remove('hidden');
                break;
            case 'epic':
                this.epicSection.classList.remove('hidden');
                break;
            case 'rare':
                this.rareSection.classList.remove('hidden');
                break;
            case 'common':
                this.commonSection.classList.remove('hidden');
                break;
        }
    }

    renderCards() {
        // 按稀有度分组
        const epicFoods = this.foods.filter(f => f.rarity === 'epic');
        const rareFoods = this.foods.filter(f => f.rarity === 'rare');
        const commonFoods = this.foods.filter(f => f.rarity === 'common');
        const hotFoods = this.foods.filter(f => f.category === '中山网红打卡点');

        // 渲染卡片
        this.epicGrid.innerHTML = epicFoods.map((food, index) => this.createCardHTML(food, index)).join('');
        this.rareGrid.innerHTML = rareFoods.map((food, index) => this.createCardHTML(food, index)).join('');
        this.commonGrid.innerHTML = commonFoods.map((food, index) => this.createCardHTML(food, index)).join('');
        this.hotGrid.innerHTML = hotFoods.map((food, index) => this.createCardHTML(food, index)).join('');

        // 更新统计
        this.epicCount.textContent = epicFoods.length;
        this.rareCount.textContent = rareFoods.length;
        this.commonCount.textContent = commonFoods.length;
        this.hotCount.textContent = hotFoods.length;

        this.totalCount.textContent = this.foods.length;
        this.epicStat.textContent = epicFoods.length;
        this.rareStat.textContent = rareFoods.length;
        this.commonStat.textContent = commonFoods.length;
        this.hotStat.textContent = hotFoods.length;
    }

    createCardHTML(food, index) {
        const rarityText = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗'
        };

        // 网红打卡卡片显示标签
        const tagsHTML = food.category === '中山网红打卡点' && food.tags
            ? `<div class="card-tags">${food.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}</div>`
            : '';

        return `
            <div class="food-card-mini rarity-${food.rarity}" data-name="${food.name}" style="animation-delay: ${index * 0.02}s">
                <span class="rarity-tag">${rarityText[food.rarity]}</span>
                <span class="card-region">${food.region}</span>
                <div class="card-emoji">${food.emoji || '🍽️'}</div>
                <div class="card-name">${food.name}</div>
                <div class="card-category">${food.category}</div>
                ${tagsHTML}
            </div>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AllCards();
});
