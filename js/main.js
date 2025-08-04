    /**
     * 商品プレビュー
     */
    previewProduct() {
        if (!this.currentProduct) {
            Utils.showMessage('プレビューする商品がありません', 'error');
            return;
        }

        // 新しいウィンドウでプレビューページを開く
        const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        
        const previewHtml = this.generatePreviewHtml(this.currentProduct);
        previewWindow.document.write(previewHtml);
        previewWindow.document.close();
    }

    /**
     * プレビュー用HTMLを生成
     * @param {Object} productData - 商品データ
     * @returns {string} HTML
     */
    generatePreviewHtml(productData) {
        return `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${Utils.escapeHtml(productData.title)} - 楽天市場</title>
                <style>
                    body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .product-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
                    .product-images { display: flex; gap: 10px; margin-bottom: 20px; }
                    .main-image img { width: 400px; height: 400px; object-fit: contain; border: 1px solid #ddd; }
                    .thumbnails { display: flex; flex-direction: column; gap: 5px; }
                    .thumbnails img { width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; cursor: pointer; }
                    .price { font-size: 28px; color: #bf0000; font-weight: bold; margin: 20px 0; }
                    .description { line-height: 1.6; margin: 20px 0; }
                    .features { margin: 20px 0; }
                    .features ul { padding-left: 20px; }
                    .features li { margin: 5px 0; }
                    .brand-info { background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="product-title">${Utils.escapeHtml(productData.title)}</h1>
                    
                    <div class="product-images">
                        <div class="main-image">
                            <img src="${productData.images?.[0] || ''}" alt="${Utils.escapeHtml(productData.title)}">
                        </div>
                        ${productData.images && productData.images.length > 1 ? `
                        <div class="thumbnails">
                            ${productData.images.slice(1, 6).map(img => 
                                `<img src="${img}" alt="商品画像" onclick="document.querySelector('.main-image img').src=this.src">`
                            ).join('')}
                        </div>` : ''}
                    </div>
                    
                    <div class="price">${Utils.formatPrice(productData.price)}</div>
                    
                    ${productData.brand ? `
                    <div class="brand-info">
                        <strong>ブランド:</strong> ${Utils.escapeHtml(productData.brand)}
                    </div>` : ''}
                    
                    <div class="description">
                        ${formBuilder.formatDescription(productData.description)}
                    </div>
                    
                    ${productData.features && productData.features.length > 0 ? `
                    <div class="features">
                        <h3>商品特徴</h3>
                        <ul>
                            ${productData.features.map(feature => 
                                `<li>${Utils.escapeHtml(feature)}</li>`
                            ).join('')}
                        </ul>
                    </div>` : ''}
                </div>
            </body>
            </html>
        `;
    }

    /**
     * 文字数カウンターを設定
     */
    setupCharacterCounters() {
        const titleInput = document.getElementById('edit-title');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                formBuilder.updateCharCount();
            });
        }
    }

    /**
     * 自動保存を設定
     */
    setupAutoSave() {
        const saveableFields = ['edit-title', 'edit-price', 'edit-description', 'edit-category', 'edit-stock', 'edit-keywords'];
        
        saveableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', Utils.debounce(() => {
                    this.autoSave();
                }, 2000));
            }
        });
    }

    /**
     * 自動保存実行
     */
    autoSave() {
        if (!this.currentProduct) return;

        try {
            const formData = {
                title: document.getElementById('edit-title')?.value || '',
                price: document.getElementById('edit-price')?.value || '',
                description: document.getElementById('edit-description')?.value || '',
                category: document.getElementById('edit-category')?.value || '',
                stock: document.getElementById('edit-stock')?.value || '',
                keywords: document.getElementById('edit-keywords')?.value || ''
            };

            localStorage.setItem('rakuten_auto_save', JSON.stringify({
                asin: this.currentProduct.asin,
                formData: formData,
                timestamp: Date.now()
            }));

            console.log('フォームデータを自動保存しました');
        } catch (error) {
            console.error('自動保存エラー:', error);
        }
    }

    /**
     * 保存された設定を読み込み
     */
    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('rakuten_auto_save');
            if (saved) {
                const data = JSON.parse(saved);
                
                // 1時間以内のデータのみ復元
                if (Date.now() - data.timestamp < 3600000) {
                    console.log('保存されたフォームデータを検出しました');
                    // 必要に応じて復元ダイアログを表示
                }
            }
        } catch (error) {
            console.error('設定読み込みエラー:', error);
        }
    }

    /**
     * 履歴に追加
     * @param {string} asin - ASIN
     * @param {string} title - 商品タイトル
     */
    addToHistory(asin, title) {
        try {
            let history = JSON.parse(localStorage.getItem('rakuten_history') || '[]');
            
            // 重複を除去
            history = history.filter(item => item.asin !== asin);
            
            // 新しいエントリを先頭に追加
            history.unshift({
                asin: asin,
                title: title,
                timestamp: Date.now()
            });
            
            // 最大50件に制限
            history = history.slice(0, 50);
            
            localStorage.setItem('rakuten_history', JSON.stringify(history));
        } catch (error) {
            console.error('履歴保存エラー:', error);
        }
    }

    /**
     * ヘルプモーダルを表示
     */
    showHelpModal() {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modalTitle) modalTitle.textContent = 'ヘルプ・使い方';
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="help-content">
                    <h4>📋 基本的な使い方</h4>
                    <ol>
                        <li><strong>ASIN入力:</strong> Amazon商品ページのASIN（10文字）を入力</li>
                        <li><strong>データ取得:</strong> 「商品データ取得」ボタンをクリック</li>
                        <li><strong>内容確認:</strong> 取得された商品情報を確認</li>
                        <li><strong>編集（任意）:</strong> 必要に応じて商品情報を編集</li>
                        <li><strong>楽天登録:</strong> 「楽天に登録」ボタンで自動登録</li>
                    </ol>
                    
                    <h4>🔍 ASINの見つけ方</h4>
                    <p>Amazon商品ページのURL: <code>amazon.co.jp/dp/<strong>B08XXXXXXX</strong>/</code><br>
                    または商品情報欄の「ASIN」項目をご確認ください。</p>
                    
                    <h4>⚡ 一括処理機能</h4>
                    <p>「一括処理モード」に切り替えると、複数のASINを改行区切りで入力して一度に処理できます。</p>
                    
                    <h4>💡 ヒント</h4>
                    <ul>
                        <li>商品タイトルは楽天の検索に最適化されています</li>
                        <li>価格は自動でマークアップが適用されます</li>
                        <li>編集した内容は自動保存されます</li>
                        <li>プレビュー機能で仕上がりを確認できます</li>
                    </ul>
                    
                    <h4>❓ トラブルシューティング</h4>
                    <ul>
                        <li><strong>商品が見つからない:</strong> ASINが正しいか確認してください</li>
                        <li><strong>API接続エラー:</strong> インターネット接続を確認してください</li>
                        <li><strong>楽天登録失敗:</strong> 商品情報を確認し、再度お試しください</li>
                    </ul>
                </div>
            `;
        }
        
        document.querySelector('.modal-overlay').style.display = 'flex';
    }

    /**
     * 設定モーダルを表示
     */
    showSettingsModal() {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modalTitle) modalTitle.textContent = '設定';
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="settings-content">
                    <h4>⚙️ システム設定</h4>
                    
                    <div class="setting-group">
                        <label>APIサーバーURL:</label>
                        <input type="text" id="api-url-setting" value="${apiClient.baseURL}" class="setting-input">
                        <small>FlaskAPIサーバーのURLを設定します</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>自動保存:</label>
                        <input type="checkbox" id="auto-save-setting" checked>
                        <small>フォーム入力内容を自動保存します</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>処理履歴:</label>
                        <button id="clear-history-btn" class="btn btn-secondary">履歴をクリア</button>
                        <small>処理済みASINの履歴を削除します</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>ログレベル:</label>
                        <select id="log-level-setting" class="setting-input">
                            <option value="ERROR">エラーのみ</option>
                            <option value="WARN">警告以上</option>
                            <option value="INFO" selected>情報以上</option>
                            <option value="DEBUG">すべて</option>
                        </select>
                        <small>コンソールに出力するログレベルを設定します</small>
                    </div>
                    
                    <div class="setting-buttons">
                        <button id="save-settings-btn" class="btn btn-primary">設定を保存</button>
                        <button id="reset-settings-btn" class="btn btn-secondary">デフォルトに戻す</button>
                    </div>
                </div>
            `;
        }
        
        // 設定保存ボタンのイベント
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // 履歴クリアボタンのイベント
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            this.clearHistory();
        });
        
        document.querySelector('.modal-overlay').style.display = 'flex';
    }

    /**
     * 設定を保存
     */
    saveSettings() {
        try {
            const settings = {
                apiUrl: document.getElementById('api-url-setting')?.value || apiClient.baseURL,
                autoSave: document.getElementById('auto-save-setting')?.checked || true,
                logLevel: document.getElementById('log-level-setting')?.value || 'INFO'
            };
            
            localStorage.setItem('rakuten_settings', JSON.stringify(settings));
            
            // APIクライアントのURLを更新
            apiClient.baseURL = settings.apiUrl;
            
            Utils.showMessage('設定を保存しました', 'success');
            this.closeModal();
            
        } catch (error) {
            console.error('設定保存エラー:', error);
            Utils.showMessage('設定の保存に失敗しました', 'error');
        }
    }

    /**
     * 履歴をクリア
     */
    clearHistory() {
        const confirmed = confirm('処理履歴をすべて削除しますか？');
        if (confirmed) {
            localStorage.removeItem('rakuten_history');
            Utils.showMessage('履歴をクリアしました', 'success');
        }
    }

    /**
     * モーダルを閉じる
     */
    closeModal() {
        document.querySelector('.modal-overlay').style.display = 'none';
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RakutenAutomationApp();
});