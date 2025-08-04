/**
 * Form Builder - 商品情報の表示・編集フォームを管理
 */
class FormBuilder {
    constructor() {
        this.currentProductData = null;
        this.categories = [];
        this.init();
    }

    /**
     * 初期化
     */
    async init() {
        try {
            // 楽天カテゴリを取得
            this.categories = await apiClient.getRakutenCategories();
            this.buildCategorySelect();
        } catch (error) {
            console.error('FormBuilder initialization error:', error);
            Utils.showMessage('カテゴリ情報の取得に失敗しました', 'warning');
        }
    }

    /**
     * 商品データを表示
     * @param {Object} productData - 商品データ
     */
    displayProduct(productData) {
        this.currentProductData = productData;
        const displayContainer = document.getElementById('product-display');
        
        const html = `
            <div class="product-display-grid">
                <!-- 商品画像 -->
                <div class="product-images">
                    <div class="main-image">
                        <img src="${productData.images && productData.images[0] ? productData.images[0] : 'images/no-image.png'}" 
                             alt="${Utils.escapeHtml(productData.title)}" 
                             id="main-product-image">
                    </div>
                    ${this.buildImageThumbnails(productData.images)}
                </div>
                
                <!-- 商品情報 -->
                <div class="product-info">
                    <div class="product-title">
                        <h3>${Utils.escapeHtml(productData.title)}</h3>
                        <div class="product-badges">
                            ${productData.brand ? `<span class="badge brand">${Utils.escapeHtml(productData.brand)}</span>` : ''}
                            ${productData.availability ? '<span class="badge stock-ok">在庫あり</span>' : '<span class="badge stock-ng">在庫切れ</span>'}
                        </div>
                    </div>
                    
                    <div class="product-price">
                        <div class="price-comparison">
                            <div class="original-price">
                                <label>Amazon価格:</label>
                                <span class="price">${Utils.formatPrice(productData.original_price || 0)}</span>
                            </div>
                            <div class="rakuten-price">
                                <label>楽天販売価格:</label>
                                <span class="price primary">${Utils.formatPrice(productData.price)}</span>
                                <span class="markup">+${Math.round((productData.markup_rate - 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="product-details">
                        <div class="detail-row">
                            <label>ASIN:</label>
                            <span>${productData.asin}</span>
                        </div>
                        ${productData.model ? `
                        <div class="detail-row">
                            <label>型番:</label>
                            <span>${Utils.escapeHtml(productData.model)}</span>
                        </div>` : ''}
                        ${productData.manufacturer ? `
                        <div class="detail-row">
                            <label>メーカー:</label>
                            <span>${Utils.escapeHtml(productData.manufacturer)}</span>
                        </div>` : ''}
                        ${productData.weight ? `
                        <div class="detail-row">
                            <label>重量:</label>
                            <span>${Utils.escapeHtml(productData.weight)}</span>
                        </div>` : ''}
                        <div class="detail-row">
                            <label>在庫数:</label>
                            <span>${productData.stock}</span>
                        </div>
                    </div>
                    
                    ${productData.rating && productData.reviews_count ? `
                    <div class="product-rating">
                        <div class="rating-stars">
                            ${this.buildStarRating(productData.rating)}
                        </div>
                        <span class="rating-text">${productData.rating}/5.0 (${productData.reviews_count}件)</span>
                    </div>` : ''}
                </div>
            </div>
            
            <!-- 商品説明 -->
            <div class="product-description">
                <h4><i class="fas fa-align-left"></i> 商品説明</h4>
                <div class="description-content">
                    ${this.formatDescription(productData.description)}
                </div>
            </div>
            
            <!-- 商品特徴 -->
            ${productData.features && productData.features.length > 0 ? `
            <div class="product-features">
                <h4><i class="fas fa-list"></i> 商品特徴</h4>
                <ul class="features-list">
                    ${productData.features.map(feature => 
                        `<li>${Utils.escapeHtml(feature)}</li>`
                    ).join('')}
                </ul>
            </div>` : ''}
            
            <!-- SEOキーワード -->
            ${productData.keywords ? `
            <div class="product-keywords">
                <h4><i class="fas fa-tags"></i> SEOキーワード</h4>
                <div class="keywords-list">
                    ${productData.keywords.split(',').map(keyword => 
                        `<span class="keyword-tag">${Utils.escapeHtml(keyword.trim())}</span>`
                    ).join('')}
                </div>
            </div>` : ''}
        `;
        
        displayContainer.innerHTML = html;
        
        // 画像サムネイルのクリックイベント
        this.bindImageEvents();
        
        // プレビューセクションを表示
        document.querySelector('.product-preview').style.display = 'block';
    }

    /**
     * 画像サムネイルを生成
     * @param {Array} images - 画像URL配列
     * @returns {string} HTML
     */
    buildImageThumbnails(images) {
        if (!images || images.length <= 1) return '';
        
        return `
            <div class="image-thumbnails">
                ${images.slice(0, 6).map((img, index) => 
                    `<img src="${img}" alt="商品画像${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`
                ).join('')}
                ${images.length > 6 ? `<div class="more-images">+${images.length - 6}</div>` : ''}
            </div>
        `;
    }

    /**
     * 星評価を生成
     * @param {number} rating - 評価値
     * @returns {string} HTML
     */
    buildStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // 満点の星
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // 半分の星
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // 空の星
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    /**
     * 商品説明をフォーマット
     * @param {string} description - 説明文
     * @returns {string} フォーマット済みHTML
     */
    formatDescription(description) {
        if (!description) return '<p>商品説明がありません</p>';
        
        // 改行を<br>に変換し、段落を<p>で囲む
        const formatted = description
            .split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
        
        return formatted || '<p>商品説明がありません</p>';
    }

    /**
     * 画像イベントをバインド
     */
    bindImageEvents() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.getElementById('main-product-image');
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                // アクティブな状態を更新
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                
                // メイン画像を更新
                const index = parseInt(thumb.dataset.index);
                if (this.currentProductData.images && this.currentProductData.images[index]) {
                    mainImage.src = this.currentProductData.images[index];
                }
            });
        });
    }

    /**
     * 編集フォームにデータを設定
     * @param {Object} productData - 商品データ
     */
    populateEditForm(productData) {
        this.currentProductData = productData;
        
        // フォームフィールドに値を設定
        document.getElementById('edit-title').value = productData.title || '';
        document.getElementById('edit-price').value = productData.price || '';
        document.getElementById('edit-description').value = productData.description || '';
        document.getElementById('edit-category').value = productData.categoryId || '';
        document.getElementById('edit-stock').value = productData.stock || 999;
        document.getElementById('edit-keywords').value = productData.keywords || '';
        
        // 文字数カウンターを更新
        this.updateCharCount();
        
        // 編集フォームを表示
        document.querySelector('.edit-form').style.display = 'block';
        document.querySelector('.product-preview').style.display = 'none';
    }

    /**
     * 編集フォームからデータを取得
     * @returns {Object} 編集済み商品データ
     */
    getEditedData() {
        const title = document.getElementById('edit-title').value.trim();
        const price = parseFloat(document.getElementById('edit-price').value);
        const description = document.getElementById('edit-description').value.trim();
        const categoryId = document.getElementById('edit-category').value;
        const stock = parseInt(document.getElementById('edit-stock').value);
        const keywords = document.getElementById('edit-keywords').value.trim();
        
        return {
            ...this.currentProductData,
            title: title,
            price: price,
            description: description,
            categoryId: categoryId,
            stock: stock,
            keywords: keywords
        };
    }

    /**
     * カテゴリセレクトボックスを構築
     */
    buildCategorySelect() {
        const categorySelect = document.getElementById('edit-category');
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '<option value="">カテゴリを選択...</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    /**
     * 文字数カウンターを更新
     */
    updateCharCount() {
        const titleInput = document.getElementById('edit-title');
        const charCountSpan = document.querySelector('.char-count');
        
        if (titleInput && charCountSpan) {
            const currentLength = titleInput.value.length;
            charCountSpan.textContent = `${currentLength}/127文字`;
            
            // 文字数制限に近づいたら警告色に変更
            if (currentLength > 100) {
                charCountSpan.classList.add('warning');
            } else {
                charCountSpan.classList.remove('warning');
            }
        }
    }

    /**
     * 処理結果を表示
     * @param {Array} results - 処理結果配列
     */
    displayResults(results) {
        const resultsContainer = document.getElementById('results-display');
        
        if (!Array.isArray(results)) {
            results = [results];
        }
        
        const html = `
            <div class="results-summary">
                <h3>処理結果サマリー</h3>
                <div class="summary-stats">
                    <div class="stat success">
                        <i class="fas fa-check-circle"></i>
                        <span class="stat-number">${results.filter(r => r.status === 'success' || r.status === 'registered').length}</span>
                        <span class="stat-label">成功</span>
                    </div>
                    <div class="stat error">
                        <i class="fas fa-times-circle"></i>
                        <span class="stat-number">${results.filter(r => r.status === 'error' || r.status === 'failed').length}</span>
                        <span class="stat-label">失敗</span>
                    </div>
                    <div class="stat total">
                        <i class="fas fa-list"></i>
                        <span class="stat-number">${results.length}</span>
                        <span class="stat-label">合計</span>
                    </div>
                </div>
            </div>
            
            <div class="results-list">
                ${results.map((result, index) => this.buildResultItem(result, index)).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = html;
        
        // 結果セクションを表示
        document.querySelector('.results-section').style.display = 'block';
    }

    /**
     * 個別の結果アイテムを構築
     * @param {Object} result - 結果データ
     * @param {number} index - インデックス
     * @returns {string} HTML
     */
    buildResultItem(result, index) {
        const isSuccess = result.status === 'success' || result.status === 'registered';
        const iconClass = isSuccess ? 'fa-check-circle success' : 'fa-times-circle error';
        
        return `
            <div class="result-item ${isSuccess ? 'success' : 'error'}">
                <div class="result-header">
                    <i class="fas ${iconClass}"></i>
                    <div class="result-info">
                        <h4>${result.asin || `商品 ${index + 1}`}</h4>
                        <span class="result-status">${isSuccess ? '登録成功' : '登録失敗'}</span>
                    </div>
                    ${result.itemUrl ? `
                    <a href="${result.itemUrl}" target="_blank" class="view-product-btn">
                        <i class="fas fa-external-link-alt"></i> 商品を見る
                    </a>` : ''}
                </div>
                
                <div class="result-details">
                    ${result.message ? `<p class="result-message">${Utils.escapeHtml(result.message)}</p>` : ''}
                    
                    ${result.data && result.data.title ? `
                    <div class="result-product-info">
                        <strong>商品名:</strong> ${Utils.escapeHtml(Utils.truncateText(result.data.title, 80))}
                    </div>` : ''}
                    
                    ${result.data && result.data.price ? `
                    <div class="result-product-info">
                        <strong>価格:</strong> ${Utils.formatPrice(result.data.price)}
                    </div>` : ''}
                    
                    ${result.itemCode ? `
                    <div class="result-product-info">
                        <strong>商品コード:</strong> ${result.itemCode}
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * フォームバリデーション
     * @returns {boolean} バリデーション結果
     */
    validateForm() {
        const title = document.getElementById('edit-title').value.trim();
        const price = document.getElementById('edit-price').value;
        
        if (!title || title.length < 3) {
            Utils.showMessage('商品名は3文字以上入力してください', 'error');
            document.getElementById('edit-title').focus();
            return false;
        }
        
        if (!price || parseFloat(price) <= 0) {
            Utils.showMessage('正しい価格を入力してください', 'error');
            document.getElementById('edit-price').focus();
            return false;
        }
        
        return true;
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        document.getElementById('product-edit-form').reset();
        this.currentProductData = null;
        document.querySelector('.edit-form').style.display = 'none';
    }
}

// グローバルインスタンス
window.formBuilder = new FormBuilder();