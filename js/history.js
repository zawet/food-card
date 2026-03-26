// 抽卡记录页面
export class HistoryPage {
    constructor() {
        this.records = [];
        
        this.historyContainer = document.getElementById('historyContainer');
        this.loading = document.getElementById('loading');
        this.totalCount = document.getElementById('totalCount');
        this.epicCount = document.getElementById('epicCount');
        this.rareCount = document.getElementById('rareCount');
        this.commonCount = document.getElementById('commonCount');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.init();
    }

    init() {
        this.loadRecords();
        this.bindEvents();
        this.render();
    }

    loadRecords() {
        const data = localStorage.getItem('food_gacha_records');
        this.records = data ? JSON.parse(data) : [];
    }

    bindEvents() {
        // 导出JSON
        this.exportBtn.addEventListener('click', () => this.exportToJson());
        
        // 清空记录
        this.clearBtn.addEventListener('click', () => this.clearRecords());
    }

    render() {
        this.loading.style.display = 'none';

        if (this.records.length === 0) {
            this.historyContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📜</span>
                    <span class="empty-text">暂无抽卡记录</span>
                    <a href="index.html" class="empty-btn">去抽卡</a>
                </div>
            `;
            this.updateStats();
            return;
        }

        // 按卡池分组
        const groups = {
            food:  { label: '美食',     icon: '🍽️', records: [] },
            drink: { label: '饮品',     icon: '🧋', records: [] },
            hot:   { label: '网红打卡点', icon: '📸', records: [] },
        };
        this.records.forEach(r => {
            const type = r.type || 'food';
            if (groups[type]) groups[type].records.push(r);
            else groups.food.records.push(r);
        });

        let html = '';
        let globalIndex = 0;
        for (const [type, group] of Object.entries(groups)) {
            if (group.records.length === 0) continue;

            const stats = this.calcGroupStats(group.records);
            html += `
                <div class="group-header">
                    <span class="group-icon">${group.icon}</span>
                    <span class="group-label">${group.label}</span>
                    <span class="group-total">${group.records.length} 次</span>
                </div>
                <div class="group-stats">
                    <span class="gs-item epic">史诗 ${stats.epic}</span>
                    <span class="gs-item rare">稀有 ${stats.rare}</span>
                    <span class="gs-item common">普通 ${stats.common}</span>
                </div>
            `;
            group.records.forEach(record => {
                html += this.createRecordHTML(record, globalIndex++, type);
            });
        }

        this.historyContainer.innerHTML = html;
        this.updateStats();
    }

    calcGroupStats(records) {
        return {
            epic:   records.filter(r => r.rarity === 'epic').length,
            rare:   records.filter(r => r.rarity === 'rare').length,
            common: records.filter(r => r.rarity === 'common').length,
        };
    }

    createRecordHTML(record, index, type) {
        const time = this.formatDateTime(record.time);
        const food = record.item || record.food || {};
        const defaultEmoji = type === 'drink' ? '🧋' : type === 'hot' ? '📸' : '🍽️';

        // 饮品额外显示商圈
        const extraTag = (type === 'drink' && food.district)
            ? `<span class="record-district">📍 ${food.district}</span>`
            : '';

        // category 优先显示，打卡点没有 category 则留空
        const categoryTag = food.category
            ? `<span class="record-category">${food.category}</span>`
            : '';

        // 美食卡：右侧显示食品图片
        const foodImgHTML = (type === 'food' && food.foodImage)
            ? `<img class="record-food-img" src="${food.foodImage}" alt="${food.name}"
                    onerror="this.style.display='none'">`
            : '';

        // 打卡点：右侧显示地区 + 标语面板
        const shopSideHTML = (type === 'hot')
            ? `<div class="record-shop-side">
                    ${food.region ? `<div class="record-shop-region">${food.region}</div>` : ''}
                    ${food.description ? `<div class="record-shop-slogan">${food.description}</div>` : ''}
               </div>`
            : '';

        return `
            <div class="record-card ${type === 'hot' ? 'record-card-hot' : ''}" style="animation-delay: ${index * 0.03}s">
                <div class="record-emoji">${food.emoji || defaultEmoji}</div>
                <div class="record-info">
                    <div class="record-name">${food.name || '未知'}</div>
                    <div class="record-meta">
                        ${categoryTag}
                        ${extraTag}
                        <span class="record-rarity ${record.rarity}">${this.getRarityText(record.rarity)}</span>
                    </div>
                    <span class="record-time">${time}</span>
                </div>
                ${foodImgHTML}
                ${shopSideHTML}
            </div>
        `;
    }

    formatDateTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        // 小于1分钟
        if (diff < 60000) {
            return '刚刚';
        }
        // 小于1小时
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        }
        // 小于24小时
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        }
        // 小于7天
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        }
        
        // 超过7天显示完整日期时间
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hour}:${minute}`;
    }

    getRarityText(rarity) {
        const texts = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗'
        };
        return texts[rarity] || '普通';
    }

    updateStats() {
        const total = this.records.length;
        const epic = this.records.filter(r => r.rarity === 'epic').length;
        const rare = this.records.filter(r => r.rarity === 'rare').length;
        const common = this.records.filter(r => r.rarity === 'common').length;
        
        this.totalCount.textContent = total;
        this.epicCount.textContent = epic;
        this.rareCount.textContent = rare;
        this.commonCount.textContent = common;
    }

    // 导出为JSON文件
    exportToJson() {
        if (this.records.length === 0) {
            alert('暂无记录可导出');
            return;
        }
        
        // 创建带格式的JSON数据
        const exportData = {
            exportTime: new Date().toISOString(),
            totalRecords: this.records.length,
            records: this.records.map(r => {
                const food = r.item || r.food || {};
                return {
                    time: r.time,
                    type: r.type,
                    food: {
                        name: food.name,
                        emoji: food.emoji,
                        category: food.category,
                        region: food.region,
                        description: food.description,
                        brand: food.brand,
                        district: food.district
                    },
                    rarity: r.rarity
                };
            })
        };
        
        // 转换为格式化后的JSON字符串
        const jsonStr = JSON.stringify(exportData, null, 2);
        
        // 创建下载
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `抽卡记录_${this.formatFileDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${year}${month}${day}_${hour}${minute}`;
    }

    // 清空记录
    clearRecords() {
        if (this.records.length === 0) {
            alert('暂无记录');
            return;
        }
        
        if (confirm('确定要清空所有抽卡记录吗？此操作不可恢复。')) {
            localStorage.removeItem('food_gacha_records');
            this.records = [];
            this.render();
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new HistoryPage();
});
