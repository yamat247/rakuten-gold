/**
 * API Client - Flask APIサーバーとの通信を管理
 */
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';  // Flask API サーバーのURL
        this.timeout = 30000; // 30秒タイムアウト
    }

    /**
     * Amazon商品データを取得
     * @param {string} asin - Amazon ASIN
     * @returns {Promise<Object>} 商品データ
     */
    async fetchAmazonProduct(asin) {
        try {
            const response = await this._makeRequest('/amazon/product', {
                method: 'POST',
                body: JSON.stringify({ asin: asin.trim().toUpperCase() }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Amazon商品データの取得に失敗しました');
            }
        } catch (error) {
            console.error('Amazon API Error:', error);
            throw error;
        }
    }

    /**
     * 楽天に商品を登録
     * @param {Object} productData - 商品データ
     * @returns {Promise<Object>} 登録結果
     */
    async registerToRakuten(productData) {
        try {
            const response = await this._makeRequest('/rakuten/register', {
                method: 'POST',
                body: JSON.stringify(productData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || '楽天への登録に失敗しました');
            }
        } catch (error) {
            console.error('Rakuten Registration Error:', error);
            throw error;
        }
    }

    /**
     * 楽天商品を更新
     * @param {string} itemUrl - 商品URL
     * @param {Object} productData - 更新データ
     * @returns {Promise<Object>} 更新結果
     */
    async updateRakutenProduct(itemUrl, productData) {
        try {
            const response = await this._makeRequest('/rakuten/update', {
                method: 'PUT',
                body: JSON.stringify({
                    itemUrl: itemUrl,
                    productData: productData
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || '楽天商品の更新に失敗しました');
            }
        } catch (error) {
            console.error('Rakuten Update Error:', error);
            throw error;
        }
    }

    /**
     * 楽天カテゴリ一覧を取得
     * @returns {Promise<Array>} カテゴリリスト
     */
    async getRakutenCategories() {
        try {
            const response = await this._makeRequest('/rakuten/categories', {
                method: 'GET'
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'カテゴリの取得に失敗しました');
            }
        } catch (error) {
            console.error('Categories Error:', error);
            // エラーが発生した場合はデフォルトカテゴリを返す
            return this._getDefaultCategories();
        }
    }

    /**
     * 一括処理
     * @param {Array<string>} asinList - ASINリスト
     * @returns {Promise<Array>} 処理結果リスト
     */
    async batchProcess(asinList) {
        try {
            const response = await this._makeRequest('/batch/process', {
                method: 'POST',
                body: JSON.stringify({ asinList: asinList }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || '一括処理に失敗しました');
            }
        } catch (error) {
            console.error('Batch Process Error:', error);
            throw error;
        }
    }

    /**
     * ヘルスチェック - API サーバーの状態確認
     * @returns {Promise<boolean>} サーバー稼働状況
     */
    async healthCheck() {
        try {
            const response = await this._makeRequest('/health', {
                method: 'GET'
            });
            return response.status === 'healthy';
        } catch (error) {
            console.error('Health Check Error:', error);
            return false;
        }
    }

    /**
     * 内部メソッド: HTTP リクエストを実行
     * @private
     */
    async _makeRequest(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        
        // タイムアウト処理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `HTTP Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // JSON パースエラーは無視
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('APIサーバーに接続できません。サーバーが起動しているか確認してください。');
            }
            
            throw error;
        }
    }

    /**
     * デフォルトカテゴリを返す
     * @private
     */
    _getDefaultCategories() {
        return [
            { id: '100371', name: 'パソコン・周辺機器' },
            { id: '100804', name: 'インテリア・寝具・収納' },
            { id: '100227', name: 'キッチン用品・食器・調理器具' },
            { id: '101070', name: 'スポーツ・アウトドア' },
            { id: '100316', name: '美容・コスメ・香水' },
            { id: '101240', name: 'おもちゃ・ホビー・ゲーム' },
            { id: '101312', name: '本・雑誌・コミック' },
            { id: '100026', name: 'TV・オーディオ・カメラ' },
            { id: '101164', name: '腕時計' },
            { id: '100804', name: 'バッグ・小物・ブランド雑貨' }
        ];
    }
}

// グローバルインスタンス
window.apiClient = new APIClient();

/**
 * ユーティリティ関数
 */
window.Utils = {
    /**
     * ASINの妥当性をチェック
     * @param {string} asin 
     * @returns {boolean}
     */
    validateASIN(asin) {
        if (!asin || typeof asin !== 'string') return false;
        const cleaned = asin.trim().toUpperCase();
        return /^[A-Z0-9]{10}$/.test(cleaned);
    },

    /**
     * 価格をフォーマット
     * @param {number} price 
     * @returns {string}
     */
    formatPrice(price) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0
        }).format(price);
    },

    /**
     * テキストを指定長さで切り詰め
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    /**
     * HTML特殊文字をエスケープ
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * ローディング状態を表示
     * @param {boolean} show 
     * @param {string} message 
     */
    showLoading(show, message = 'データを取得中...') {
        const loadingSection = document.querySelector('.loading-section');
        const loadingTitle = document.getElementById('loading-title');
        
        if (show) {
            if (loadingTitle) loadingTitle.textContent = message;
            loadingSection.style.display = 'block';
        } else {
            loadingSection.style.display = 'none';
        }
    },

    /**
     * エラーメッセージを表示
     * @param {string} message 
     * @param {string} type 
     */
    showMessage(message, type = 'error') {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // メッセージトーストを作成
        const toast = document.createElement('div');
        toast.className = `message-toast ${type}`;
        toast.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="message-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // 閉じるボタンのイベント
        toast.querySelector('.message-close').addEventListener('click', () => {
            toast.remove();
        });

        // 5秒後に自動で消去
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    },

    /**
     * デバウンス処理
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};