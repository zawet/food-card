import AppConfig from '../config.js';

// 饮品品牌英文名映射（用于 logo fallback）
const BRAND_EN = {
    '霸王茶姬': 'ChaMama',
    '喜茶': 'HEYTEA',
    '奈雪的茶': 'Nayuki',
    '古茗': 'Gumii',
    '茶百道': 'ChaBaiDao',
    '蜜雪冰城': 'MIXUE',
    '沪上阿姨': 'hushangy',
    '爷爷不泡茶': 'YeYe Tea',
    '一点点': 'OneZone',
    '乐乐茶': 'Lelecha',
    '茶颜悦色': 'ChayYan',
    '察理王子': 'Cha Li',
    '粮仓': 'Liangcang',
    '窦柠柠檬茶': 'Douning',
    'Vinko小厨': 'Vinko',
    '珍珠公': 'ZhenZhu',
    '808Bass咖啡': '808 Bass',
};

class AllCards {
    constructor() {
        this.foods  = [];   // 美食数据
        this.drinks = [];   // 饮料数据
        this.shops  = [];   // 店铺数据

        this.currentPool = 'all';   // 当前显示哪个卡池组

        // 每个卡池组独立的稀有度筛选状态
        this.poolFilters = {
            food:  'all',
            drink: 'all',
            shop:  'all',
        };

        this.records  = [];
        this.cardModal = document.getElementById('cardModal');

        this.init();
    }

    async init() {
        await Promise.all([
            this.loadFoods(),
            this.loadDrinks(),
            this.loadShops(),
        ]);
        this.loadRecords();
        this.bindEvents();
        this.renderAll();
    }

    // ──────────── 数据加载 ────────────

    async loadFoods() {
        try {
            const res = await fetch('data/foods.json');
            const data = await res.json();
            this.foods = data.map(item => ({
                ...item,
                _pool: 'food',
                foodImage: item.foodImage
                    ? AppConfig.foodImageBaseUrl + item.foodImage
                    : null,
            }));
        } catch (e) {
            console.error('加载美食数据失败:', e);
        }
    }

    async loadDrinks() {
        try {
            const res = await fetch('data/drinks.json');
            const data = await res.json();
            this.drinks = data.map(item => ({ ...item, _pool: 'drink' }));
        } catch (e) {
            console.error('加载饮料数据失败:', e);
        }
    }

    async loadShops() {
        try {
            const res = await fetch('data/shops.json');
            const data = await res.json();
            this.shops = data.map(item => ({ ...item, _pool: 'shop' }));
        } catch (e) {
            console.error('加载店铺数据失败:', e);
        }
    }

    loadRecords() {
        const data = localStorage.getItem('food_gacha_records');
        this.records = data ? JSON.parse(data) : [];
    }

    getDrawCount(name) {
        return this.records.filter(r => {
            const item = r.item || r.food;
            return item && item.name === name;
        }).length;
    }

    // ──────────── 事件绑定 ────────────

    bindEvents() {
        // 卡池 Tab（控制显示哪个卡池组 + 滚动定位）
        document.querySelectorAll('.pool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPool = btn.dataset.pool;
                this.applyPoolFilter();
                this.scrollToPool(btn.dataset.pool);
            });
        });

        // 卡池组收起/展开按钮
        document.querySelectorAll('.pool-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const poolGroup = btn.closest('.pool-group');
                this.togglePoolGroup(poolGroup);
            });
        });

        // 点击卡池组标题也可以收起/展开
        document.querySelectorAll('.pool-group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // 如果点击的是收起按钮，不重复处理
                if (e.target.closest('.pool-toggle-btn')) return;
                const poolGroup = header.closest('.pool-group');
                this.togglePoolGroup(poolGroup);
            });
        });

        // 各卡池组内的稀有度 Tab（独立控制）
        document.querySelectorAll('.pool-tab-bar').forEach(tabBar => {
            const pool = tabBar.dataset.pool;
            tabBar.querySelectorAll('.pool-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // 更新当前卡池组的选中状态
                    tabBar.querySelectorAll('.pool-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // 保存筛选状态
                    this.poolFilters[pool] = btn.dataset.rarity;
                    // 应用该卡池组的稀有度筛选
                    this.applyPoolRarityFilter(pool, btn.dataset.rarity);
                });
            });
        });

        // 弹窗关闭
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeModal());

        // 卡片点击（事件委托）
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.food-card-mini');
            if (!card) return;
            const pool = card.dataset.pool;
            const name = card.dataset.name;
            let item = null;
            if (pool === 'food')  item = this.foods.find(f => f.name === name);
            if (pool === 'drink') item = this.drinks.find(f => f.name === name);
            if (pool === 'shop')  item = this.shops.find(f => f.name === name);
            if (item) this.showModal(item, pool);
        });
    }

    // ──────────── 筛选显示 ────────────

    // 收起/展开卡池组
    togglePoolGroup(poolGroup) {
        const isExpanded = poolGroup.classList.contains('expanded');
        if (isExpanded) {
            poolGroup.classList.remove('expanded');
            poolGroup.classList.add('collapsed');
        } else {
            poolGroup.classList.remove('collapsed');
            poolGroup.classList.add('expanded');
        }
    }

    // 展开指定卡池组
    expandPoolGroup(pool) {
        const poolMap = { food: 'poolFood', drink: 'poolDrink', shop: 'poolShop' };
        const element = document.getElementById(poolMap[pool]);
        if (element) {
            element.classList.remove('collapsed');
            element.classList.add('expanded');
        }
    }

    // 滚动到指定卡池
    scrollToPool(pool) {
        const app = document.querySelector('.app');
        if (pool === 'all') {
            // 全部：滚动到顶部
            app.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const poolMap = {
            food: 'poolFood',
            drink: 'poolDrink',
            shop: 'poolShop',
        };
        const element = document.getElementById(poolMap[pool]);
        if (element) {
            // 先展开该卡池组
            this.expandPoolGroup(pool);
            // 计算滚动位置，留出 header 空间（约 140px）
            const headerOffset = 140;
            const elementPosition = element.offsetTop - headerOffset;
            app.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
    }

    // 卡池组显示/隐藏
    applyPoolFilter() {
        const pool = this.currentPool;
        const showFood  = pool === 'all' || pool === 'food';
        const showDrink = pool === 'all' || pool === 'drink';
        const showShop  = pool === 'all' || pool === 'shop';

        document.getElementById('poolFood').classList.toggle('hidden', !showFood);
        document.getElementById('poolDrink').classList.toggle('hidden', !showDrink);
        document.getElementById('poolShop').classList.toggle('hidden', !showShop);
    }

    // 单个卡池组内的稀有度筛选
    applyPoolRarityFilter(pool, rarity) {
        const sections = {
            epic:   document.getElementById(`${pool}EpicSection`),
            rare:   document.getElementById(`${pool}RareSection`),
            common: document.getElementById(`${pool}CommonSection`),
        };
        const hotSection = document.getElementById(`${pool}HotSection`);

        const showAll    = rarity === 'all';
        const showHot    = rarity === 'all' || rarity === 'hot';
        const showEpic   = rarity === 'all' || rarity === 'epic';
        const showRare   = rarity === 'all' || rarity === 'rare';
        const showCommon = rarity === 'all' || rarity === 'common';

        if (sections.epic)   sections.epic.classList.toggle('hidden', !showEpic);
        if (sections.rare)   sections.rare.classList.toggle('hidden', !showRare);
        if (sections.common) sections.common.classList.toggle('hidden', !showCommon);
        if (hotSection)      hotSection.classList.toggle('hidden', !showHot);
    }

    // ──────────── 渲染 ────────────

    renderAll() {
        this._renderFoodPool();
        this._renderDrinkPool();
        this._renderShopPool();
        this._renderStats();

        // 初始化各卡池组的稀有度筛选
        Object.keys(this.poolFilters).forEach(pool => {
            this.applyPoolRarityFilter(pool, this.poolFilters[pool]);
        });
    }

    _renderFoodPool() {
        const epicList   = this.foods.filter(f => f.rarity === 'epic');
        const rareList   = this.foods.filter(f => f.rarity === 'rare');
        const commonList = this.foods.filter(f => f.rarity === 'common');

        document.getElementById('foodEpicGrid').innerHTML   = epicList.map((f, i)   => this.createFoodCardHTML(f, i)).join('');
        document.getElementById('foodRareGrid').innerHTML   = rareList.map((f, i)   => this.createFoodCardHTML(f, i)).join('');
        document.getElementById('foodCommonGrid').innerHTML = commonList.map((f, i) => this.createFoodCardHTML(f, i)).join('');

        document.getElementById('foodEpicCount').textContent   = epicList.length;
        document.getElementById('foodRareCount').textContent   = rareList.length;
        document.getElementById('foodCommonCount').textContent = commonList.length;
        document.getElementById('foodPoolTotal').textContent   = this.foods.length;
    }

    _renderDrinkPool() {
        const epicList   = this.drinks.filter(d => d.rarity === 'epic');
        const rareList   = this.drinks.filter(d => d.rarity === 'rare');
        const commonList = this.drinks.filter(d => d.rarity === 'common');

        document.getElementById('drinkEpicGrid').innerHTML   = epicList.map((d, i)   => this.createDrinkCardHTML(d, i)).join('');
        document.getElementById('drinkRareGrid').innerHTML   = rareList.map((d, i)   => this.createDrinkCardHTML(d, i)).join('');
        document.getElementById('drinkCommonGrid').innerHTML = commonList.map((d, i) => this.createDrinkCardHTML(d, i)).join('');

        document.getElementById('drinkEpicCount').textContent   = epicList.length;
        document.getElementById('drinkRareCount').textContent   = rareList.length;
        document.getElementById('drinkCommonCount').textContent = commonList.length;
        document.getElementById('drinkPoolTotal').textContent   = this.drinks.length;
    }

    _renderShopPool() {
        const hotList    = this.shops.filter(s => s.category === '中山网红打卡点');
        const epicList   = this.shops.filter(s => s.rarity === 'epic'   && s.category !== '中山网红打卡点');
        const rareList   = this.shops.filter(s => s.rarity === 'rare'   && s.category !== '中山网红打卡点');
        const commonList = this.shops.filter(s => s.rarity === 'common' && s.category !== '中山网红打卡点');

        document.getElementById('shopHotGrid').innerHTML    = hotList.map((s, i)    => this.createShopCardHTML(s, i)).join('');
        document.getElementById('shopEpicGrid').innerHTML   = epicList.map((s, i)   => this.createShopCardHTML(s, i)).join('');
        document.getElementById('shopRareGrid').innerHTML   = rareList.map((s, i)   => this.createShopCardHTML(s, i)).join('');
        document.getElementById('shopCommonGrid').innerHTML = commonList.map((s, i) => this.createShopCardHTML(s, i)).join('');

        document.getElementById('shopHotCount').textContent    = hotList.length;
        document.getElementById('shopEpicCount').textContent   = epicList.length;
        document.getElementById('shopRareCount').textContent   = rareList.length;
        document.getElementById('shopCommonCount').textContent = commonList.length;
        document.getElementById('shopPoolTotal').textContent   = this.shops.length;
    }

    _renderStats() {
        const total = this.foods.length + this.drinks.length + this.shops.length;
        document.getElementById('totalCount').textContent = total;
        document.getElementById('foodStat').textContent   = this.foods.length;
        document.getElementById('drinkStat').textContent  = this.drinks.length;
        document.getElementById('shopStat').textContent   = this.shops.length;
    }

    // ──────────── 卡片 HTML ────────────

    createFoodCardHTML(food, index) {
        const rarityLabel = { common: '普通', rare: '稀有', epic: '史诗' };
        const mediaHTML = food.foodImage
            ? `<div class="card-img-wrap"><img class="card-food-img" src="${food.foodImage}" alt="${food.name}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\'card-emoji\'>${food.emoji || '🍽️'}</div>'"></div>`
            : `<div class="card-emoji">${food.emoji || '🍽️'}</div>`;

        return `
            <div class="food-card-mini rarity-${food.rarity}" data-name="${food.name}" data-pool="food" style="animation-delay:${index * 0.02}s">
                <span class="rarity-tag">${rarityLabel[food.rarity] || ''}</span>
                ${mediaHTML}
                <div class="card-name">${food.name}</div>
                <div class="card-category">${food.category}</div>
            </div>
        `;
    }

    createDrinkCardHTML(drink, index) {
        const rarityLabel = { common: '普通', rare: '稀有', epic: '史诗' };
        const logoHTML = drink.brandLogo
            ? `<div class="card-logo-wrap"><img class="card-brand-logo" src="${drink.brandLogo}" alt="${drink.brand}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\'card-emoji\'>${drink.emoji || '🧋'}</div>'"></div>`
            : `<div class="card-emoji">${drink.emoji || '🧋'}</div>`;

        const brandEN = BRAND_EN[drink.brand] || '';
        const brandTag = drink.brand
            ? `<span class="card-brand-tag">${brandEN || drink.brand}</span>`
            : '';

        return `
            <div class="food-card-mini rarity-${drink.rarity} drink-card" data-name="${drink.name}" data-pool="drink" style="animation-delay:${index * 0.02}s">
                <span class="rarity-tag">${rarityLabel[drink.rarity] || ''}</span>
                ${brandTag}
                ${logoHTML}
                <div class="card-name">${drink.name}</div>
                <div class="card-category">${drink.brand}</div>
            </div>
        `;
    }

    createShopCardHTML(shop, index) {
        const rarityLabel = { common: '普通', rare: '稀有', epic: '史诗' };
        const isHot = shop.category === '中山网红打卡点';

        const regionDisplay = shop.region || shop.district || '';
        const cityHTML = regionDisplay
            ? `<div class="card-city-badge">${regionDisplay}</div>`
            : '';

        const tagsHTML = isHot && shop.tags && shop.tags.length
            ? `<div class="card-tags">${shop.tags.slice(0, 2).map(t => `<span class="card-tag">${t}</span>`).join('')}</div>`
            : '';

        const rarityOrHot = isHot ? 'hot' : (shop.rarity || 'common');
        const label = isHot ? '打卡' : (rarityLabel[shop.rarity] || '普通');

        return `
            <div class="food-card-mini rarity-${rarityOrHot} shop-card" data-name="${shop.name}" data-pool="shop" style="animation-delay:${index * 0.02}s">
                <span class="rarity-tag">${label}</span>
                <div class="card-emoji">${shop.emoji || '🏪'}</div>
                <div class="card-name">${shop.name}</div>
                ${cityHTML}
                ${tagsHTML}
            </div>
        `;
    }

    // ──────────── 弹窗 ────────────

    showModal(item, pool) {
        const rarityText = { common: '普通', rare: '稀有', epic: '史诗' };
        const drawCount = this.getDrawCount(item.name);

        const emojiEl = document.getElementById('modalEmoji');
        if (pool === 'food' && item.foodImage) {
            emojiEl.innerHTML = `<img src="${item.foodImage}" alt="${item.name}" style="width:80px;height:80px;object-fit:contain;border-radius:12px;" onerror="this.outerHTML='${item.emoji || '🍽️'}'">`;
        } else if (pool === 'drink' && item.brandLogo) {
            emojiEl.innerHTML = `<img src="${item.brandLogo}" alt="${item.brand}" style="width:80px;height:80px;object-fit:contain;border-radius:12px;" onerror="this.outerHTML='${item.emoji || '🧋'}'">`;
        } else {
            emojiEl.textContent = item.emoji || (pool === 'drink' ? '🧋' : pool === 'shop' ? '🏪' : '🍽️');
        }

        document.getElementById('modalName').textContent     = item.name;
        document.getElementById('modalDescription').textContent = item.description || '';
        document.getElementById('drawCount').textContent     = drawCount;

        if (pool === 'drink') {
            const region = item.region ? ` · ${item.region}` : '';
            document.getElementById('modalCategory').textContent = `${item.brand}${region}`;
        } else {
            const region = item.region ? ` · ${item.region}` : '';
            document.getElementById('modalCategory').textContent = `${item.category || ''}${region}`;
        }

        const rarity = item.category === '中山网红打卡点' ? 'hot' : (item.rarity || 'common');
        const rarityLabel = rarity === 'hot' ? '网红打卡' : (rarityText[rarity] || '普通');
        document.getElementById('modalRarity').textContent = rarityLabel;

        const tagsContainer = document.getElementById('modalTags');
        if (item.tags && item.tags.length > 0) {
            tagsContainer.innerHTML = item.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');
        } else {
            tagsContainer.innerHTML = '';
        }

        const modalCard = document.getElementById('modalCard');
        modalCard.className = 'modal-card rarity-' + (rarity === 'hot' ? 'hot' : rarity);

        this.cardModal.classList.add('active');
    }

    closeModal() {
        document.getElementById('cardModal').classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AllCards();
});
