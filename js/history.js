// 抽卡记录页面
class HistoryPage {
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
                    <a href="draw.html" class="empty-btn">去抽卡</a>
                </div>
            `;
            this.updateStats();
            return;
        }
        
        this.historyContainer.innerHTML = this.records.map((record, index) => 
            this.createRecordHTML(record, index)
        ).join('');
        
        this.updateStats();
    }

    createRecordHTML(record, index) {
        const time = this.formatDateTime(record.time);
        
        return `
            <div class="record-card" style="animation-delay: ${index * 0.03}s">
                <div class="record-emoji">${record.food.emoji || '🍽️'}</div>
                <div class="record-info">
                    <div class="record-name">${record.food.name}</div>
                    <div class="record-meta">
                        <span class="record-category">${record.food.category}</span>
                        <span class="record-rarity ${record.rarity}">${this.getRarityText(record.rarity)}</span>
                    </div>
                    <span class="record-time">${time}</span>
                </div>
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
            records: this.records.map(r => ({
                time: r.time,
                food: {
                    name: r.food.name,
                    emoji: r.food.emoji,
                    category: r.food.category,
                    region: r.food.region,
                    description: r.food.description
                },
                rarity: r.rarity
            }))
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
