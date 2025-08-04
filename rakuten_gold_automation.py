# 楽天GOLD商品ページ自動生成システム
# Rakuten GOLD Product Page Automation System

import os
import json
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import csv
from dataclasses import dataclass
import sqlite3
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ProductInfo:
    """商品情報データクラス"""
    asin: str
    title: str
    price: float
    description: str
    images: List[str]
    category: str
    features: List[str]
    specifications: Dict[str, str]

@dataclass
class RakutenProductData:
    """楽天商品データクラス"""
    item_name: str
    item_price: int
    item_caption: str
    category_id: str
    item_url: str
    images: List[str]
    delivery_flag: int
    postage_flag: int
    tax_flag: int

class AmazonDataCollector:
    """Amazon商品データ収集システム"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('PRODUCT_DATA_API_KEY')
        self.base_url = "https://api.productdata.com/v1"
        
    async def fetch_product_data(self, asin: str) -> Optional[ProductInfo]:
        """ASIN から商品データを取得"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                }
                
                url = f"{self.base_url}/products/{asin}"
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_amazon_data(data)
                    else:
                        logger.error(f"API request failed: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error fetching product data: {e}")
            return None
    
    def _parse_amazon_data(self, data: Dict) -> ProductInfo:
        """Amazon APIレスポンスをパース"""
        return ProductInfo(
            asin=data.get('asin', ''),
            title=data.get('title', ''),
            price=float(data.get('price', {}).get('value', 0)),
            description=data.get('description', ''),
            images=data.get('images', []),
            category=data.get('category', ''),
            features=data.get('features', []),
            specifications=data.get('specifications', {})
        )

class RakutenCategoryMapper:
    """楽天カテゴリマッピングシステム"""
    
    def __init__(self):
        self.mapping_db = self._load_category_mapping()
    
    def _load_category_mapping(self) -> Dict[str, str]:
        """Amazon → 楽天 カテゴリマッピングを読み込み"""
        mapping = {
            'Electronics': '558885',
            'Home & Kitchen': '100804',
            'Sports & Outdoors': '101070',
            'Toys & Games': '101164',
            'Clothing': '100316',
            'Books': '101240',
            'Health & Personal Care': '101344',
            'Beauty': '101344',
            'Automotive': '100897',
            'Tools & Home Improvement': '100804',
        }
        return mapping
    
    def get_rakuten_category(self, amazon_category: str) -> str:
        """Amazon カテゴリから楽天カテゴリIDを取得"""
        return self.mapping_db.get(amazon_category, '100804')  # デフォルト: 日用品

class AIContentGenerator:
    """AI商品説明文生成システム"""
    
    def __init__(self, gemini_api_key: str = None, claude_api_key: str = None):
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.claude_api_key = claude_api_key or os.getenv('CLAUDE_API_KEY')
    
    async def generate_rakuten_title(self, product: ProductInfo) -> str:
        """楽天用SEO最適化タイトル生成"""
        prompt = f"""
        以下のAmazon商品情報から、楽天市場向けのSEO最適化されたタイトルを生成してください。

        商品名: {product.title}
        カテゴリ: {product.category}
        価格: ¥{product.price:,.0f}
        特徴: {', '.join(product.features[:3])}

        要件:
        - 50文字以内
        - 楽天市場で検索されやすいキーワードを含む
        - 【送料無料】【即納】などの楽天らしい表現を含む
        - 商品の魅力を最大限アピール

        楽天用タイトル:
        """
        
        return await self._call_ai_api(prompt, "title")
    
    async def generate_rakuten_description(self, product: ProductInfo) -> str:
        """楽天用商品説明文生成"""
        prompt = f"""
        以下のAmazon商品情報から、楽天市場向けの魅力的な商品説明文を生成してください。

        商品名: {product.title}
        説明: {product.description}
        特徴: {', '.join(product.features)}
        仕様: {json.dumps(product.specifications, ensure_ascii=False)}

        要件:
        - HTMLタグを使用した見やすいレイアウト
        - 楽天市場のユーザーに響く表現
        - 購買意欲を高める内容
        - 1000文字以上の詳細な説明
        - 商品の利用シーンや効果を具体的に記載

        楽天用商品説明文:
        """
        
        return await self._call_ai_api(prompt, "description")
    
    async def _call_ai_api(self, prompt: str, content_type: str) -> str:
        """AI API呼び出し（Gemini使用）"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            response = model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"AI API call failed: {e}")
            return f"自動生成に失敗しました: {content_type}"

class RakutenGoldPageGenerator:
    """楽天GOLD商品ページ生成システム"""
    
    def __init__(self):
        self.template_path = Path("templates/rakuten_gold_template.html")
        self.output_path = Path("output/rakuten_pages")
        self.output_path.mkdir(parents=True, exist_ok=True)
    
    def generate_gold_page(self, product: ProductInfo, rakuten_data: RakutenProductData) -> str:
        """楽天GOLDページ生成"""
        template = self._load_template()
        
        # テンプレート変数置換
        html_content = template.format(
            item_name=rakuten_data.item_name,
            item_price=f"¥{rakuten_data.item_price:,}",
            item_caption=rakuten_data.item_caption,
            main_image=rakuten_data.images[0] if rakuten_data.images else "",
            sub_images=self._generate_image_gallery(rakuten_data.images[1:]),
            product_features=self._generate_features_html(product.features),
            specifications=self._generate_specs_table(product.specifications),
            related_products=self._generate_related_products(),
            current_date=datetime.now().strftime("%Y年%m月%d日"),
            meta_description=product.description[:150],
            meta_keywords=f"{product.category}, 楽天, {', '.join(product.features[:3])}",
            item_url=rakuten_data.item_url,
            item_price_numeric=rakuten_data.item_price
        )
        
        # ファイル保存
        filename = f"product_{product.asin}_{datetime.now().strftime('%Y%m%d')}.html"
        output_file = self.output_path / filename
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"楽天GOLDページ生成完了: {output_file}")
        return str(output_file)
    
    def _load_template(self) -> str:
        """HTMLテンプレート読み込み"""
        if self.template_path.exists():
            with open(self.template_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            return self._create_default_template()
    
    def _create_default_template(self) -> str:
        """デフォルトテンプレート作成"""
        return """<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{item_name}</title>
    <style>
        body {{ font-family: "Hiragino Sans", "ヒラギノ角ゴ ProN W3", sans-serif; }}
        .container {{ max-width: 1000px; margin: 0 auto; padding: 20px; }}
        .product-header {{ text-align: center; margin-bottom: 30px; }}
        .product-title {{ font-size: 28px; color: #c41230; font-weight: bold; }}
        .product-price {{ font-size: 36px; color: #e60012; margin: 20px 0; }}
        .product-images {{ display: flex; gap: 20px; margin: 30px 0; }}
        .main-image {{ flex: 2; }}
        .sub-images {{ flex: 1; }}
        .features {{ background: #f8f8f8; padding: 20px; margin: 30px 0; }}
        .specs-table {{ width: 100%; border-collapse: collapse; margin: 30px 0; }}
        .specs-table th, .specs-table td {{ border: 1px solid #ddd; padding: 10px; }}
        .buy-button {{ background: #e60012; color: white; padding: 15px 30px; font-size: 18px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="product-header">
            <h1 class="product-title">{item_name}</h1>
            <div class="product-price">{item_price}</div>
        </div>
        
        <div class="product-images">
            <div class="main-image">
                <img src="{main_image}" alt="{item_name}" style="width: 100%; max-width: 500px;">
            </div>
            <div class="sub-images">
                {sub_images}
            </div>
        </div>
        
        <div class="product-description">
            {item_caption}
        </div>
        
        <div class="features">
            <h3>商品の特徴</h3>
            {product_features}
        </div>
        
        <div class="specifications">
            <h3>商品仕様</h3>
            {specifications}
        </div>
        
        <div class="related-products">
            <h3>関連商品</h3>
            {related_products}
        </div>
        
        <div style="text-align: center; margin: 50px 0;">
            <button class="buy-button">今すぐ購入</button>
        </div>
        
        <div style="text-align: center; color: #666; margin-top: 50px;">
            最終更新: {current_date}
        </div>
    </div>
</body>
</html>"""
    
    def _generate_image_gallery(self, images: List[str]) -> str:
        """画像ギャラリー生成"""
        if not images:
            return ""
        
        gallery_html = ""
        for img_url in images[:4]:  # 最大4枚
            gallery_html += f'<img src="{img_url}" style="width: 100%; margin-bottom: 10px;">\n'
        
        return gallery_html
    
    def _generate_features_html(self, features: List[str]) -> str:
        """特徴リスト生成"""
        if not features:
            return "<p>特徴情報がありません</p>"
        
        features_html = "<ul>\n"
        for feature in features:
            features_html += f"<li>{feature}</li>\n"
        features_html += "</ul>"
        
        return features_html
    
    def _generate_specs_table(self, specs: Dict[str, str]) -> str:
        """仕様テーブル生成"""
        if not specs:
            return "<p>仕様情報がありません</p>"
        
        table_html = '<table class="specs-table">\n'
        for key, value in specs.items():
            table_html += f"<tr><th>{key}</th><td>{value}</td></tr>\n"
        table_html += "</table>"
        
        return table_html
    
    def _generate_related_products(self) -> str:
        """関連商品セクション生成"""
        return """
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px;">
                <img src="placeholder.jpg" style="width: 100%;">
                <p>関連商品1</p>
            </div>
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px;">
                <img src="placeholder.jpg" style="width: 100%;">
                <p>関連商品2</p>
            </div>
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px;">
                <img src="placeholder.jpg" style="width: 100%;">
                <p>関連商品3</p>
            </div>
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px;">
                <img src="placeholder.jpg" style="width: 100%;">
                <p>関連商品4</p>
            </div>
        </div>
        """

class RakutenAPIConnector:
    """楽天RMS API連携システム"""
    
    def __init__(self, service_secret: str = None, license_key: str = None):
        self.service_secret = service_secret or os.getenv('RAKUTEN_SERVICE_SECRET')
        self.license_key = license_key or os.getenv('RAKUTEN_LICENSE_KEY')
        self.base_url = "https://api.rms.rakuten.co.jp/es/1.0"
    
    async def upload_product(self, rakuten_data: RakutenProductData) -> bool:
        """楽天に商品をアップロード"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'ESA {self.service_secret}:{self.license_key}'
            }
            
            product_data = {
                'item': {
                    'itemUrl': rakuten_data.item_url,
                    'itemName': rakuten_data.item_name,
                    'itemPrice': rakuten_data.item_price,
                    'itemCaption': rakuten_data.item_caption,
                    'categoryId': rakuten_data.category_id,
                    'images': [{'imageUrl': img} for img in rakuten_data.images],
                    'deliveryFlag': rakuten_data.delivery_flag,
                    'postageFlag': rakuten_data.postage_flag,
                    'taxFlag': rakuten_data.tax_flag
                }
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/item/insert"
                async with session.post(url, headers=headers, json=product_data) as response:
                    if response.status == 200:
                        logger.info(f"商品アップロード成功: {rakuten_data.item_name}")
                        return True
                    else:
                        logger.error(f"商品アップロード失敗: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error uploading product: {e}")
            return False

class RakutenGoldAutomationSystem:
    """楽天GOLD自動化システム メインクラス"""
    
    def __init__(self):
        self.amazon_collector = AmazonDataCollector()
        self.category_mapper = RakutenCategoryMapper()
        self.ai_generator = AIContentGenerator()
        self.page_generator = RakutenGoldPageGenerator()
        self.rakuten_api = RakutenAPIConnector()
        self.db_path = "rakuten_automation.db"
        self._init_database()
    
    def _init_database(self):
        """データベース初期化"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processed_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asin TEXT UNIQUE,
                rakuten_item_url TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS automation_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asin TEXT,
                action TEXT,
                status TEXT,
                message TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    async def process_asin(self, asin: str) -> Dict[str, Any]:
        """ASINを処理して楽天商品を生成"""
        result = {
            'asin': asin,
            'success': False,
            'message': '',
            'rakuten_url': '',
            'gold_page_path': ''
        }
        
        try:
            # 1. Amazon商品データ取得
            self._log_action(asin, "fetch_amazon_data", "start", "Amazon商品データ取得開始")
            product_data = await self.amazon_collector.fetch_product_data(asin)
            
            if not product_data:
                result['message'] = "Amazon商品データの取得に失敗しました"
                return result
            
            # 2. 楽天カテゴリマッピング
            rakuten_category = self.category_mapper.get_rakuten_category(product_data.category)
            
            # 3. AI生成（タイトル・説明文）
            self._log_action(asin, "ai_generation", "start", "AI コンテンツ生成開始")
            rakuten_title = await self.ai_generator.generate_rakuten_title(product_data)
            rakuten_description = await self.ai_generator.generate_rakuten_description(product_data)
            
            # 4. 楽天商品データ作成
            rakuten_data = RakutenProductData(
                item_name=rakuten_title,
                item_price=int(product_data.price * 1.2),  # 20%マージン
                item_caption=rakuten_description,
                category_id=rakuten_category,
                item_url=f"product-{asin.lower()}",
                images=product_data.images,
                delivery_flag=1,  # 配送料込み
                postage_flag=0,   # 送料無料
                tax_flag=1        # 税込み
            )
            
            # 5. 楽天GOLDページ生成
            self._log_action(asin, "generate_gold_page", "start", "楽天GOLDページ生成開始")
            gold_page_path = self.page_generator.generate_gold_page(product_data, rakuten_data)
            
            # 6. 楽天RMS API経由でアップロード
            self._log_action(asin, "upload_rakuten", "start", "楽天商品アップロード開始")
            upload_success = await self.rakuten_api.upload_product(rakuten_data)
            
            if upload_success:
                # 7. データベース更新
                self._update_product_status(asin, rakuten_data.item_url, "completed")
                
                result.update({
                    'success': True,
                    'message': '楽天商品の生成とアップロードが完了しました',
                    'rakuten_url': f"https://item.rakuten.co.jp/yourshop/{rakuten_data.item_url}/",
                    'gold_page_path': gold_page_path
                })
                
                self._log_action(asin, "process_complete", "success", "処理完了")
            else:
                result['message'] = "楽天への商品アップロードに失敗しました"
                self._log_action(asin, "upload_rakuten", "failed", "アップロード失敗")
        
        except Exception as e:
            result['message'] = f"処理中にエラーが発生しました: {str(e)}"
            self._log_action(asin, "process_error", "error", str(e))
        
        return result
    
    async def bulk_process_asins(self, asin_list: List[str]) -> List[Dict[str, Any]]:
        """複数ASINの一括処理"""
        results = []
        
        for asin in asin_list:
            logger.info(f"Processing ASIN: {asin}")
            result = await self.process_asin(asin)
            results.append(result)
            
            # API制限回避のため1秒待機
            await asyncio.sleep(1)
        
        return results
    
    def _update_product_status(self, asin: str, rakuten_url: str, status: str):
        """商品ステータス更新"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO processed_products 
            (asin, rakuten_item_url, status, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (asin, rakuten_url, status))
        
        conn.commit()
        conn.close()
    
    def _log_action(self, asin: str, action: str, status: str, message: str):
        """アクションログ記録"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO automation_log (asin, action, status, message)
            VALUES (?, ?, ?, ?)
        """, (asin, action, status, message))
        
        conn.commit()
        conn.close()
        
        logger.info(f"{asin} - {action}: {status} - {message}")
    
    def get_processing_status(self) -> Dict[str, Any]:
        """処理状況取得"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 処理済み商品数
        cursor.execute("SELECT COUNT(*) FROM processed_products WHERE status = 'completed'")
        completed_count = cursor.fetchone()[0]
        
        # 失敗商品数
        cursor.execute("SELECT COUNT(*) FROM processed_products WHERE status = 'failed'")
        failed_count = cursor.fetchone()[0]
        
        # 最近のログ
        cursor.execute("""
            SELECT asin, action, status, message, timestamp 
            FROM automation_log 
            ORDER BY timestamp DESC 
            LIMIT 10
        """)
        recent_logs = cursor.fetchall()
        
        conn.close()
        
        return {
            'completed_products': completed_count,
            'failed_products': failed_count,
            'recent_logs': recent_logs,
            'total_processed': completed_count + failed_count
        }

# 使用例とメイン実行部分
async def main():
    """メイン実行関数"""
    # システム初期化
    automation_system = RakutenGoldAutomationSystem()
    
    # テスト用ASIN（実際のASINに置き換えてください）
    test_asins = [
        "B07XJ8C8F5",  # Echo Dot
        "B085KNRR34",  # Fire TV Stick
        "B08N5WRWNW"   # Echo Show 5
    ]
    
    print("楽天GOLD商品ページ自動生成システム開始")
    print("=" * 50)
    
    # 複数ASINを一括処理
    results = await automation_system.bulk_process_asins(test_asins)
    
    # 結果表示
    print("\n処理結果:")
    print("=" * 50)
    for result in results:
        status = "✅ 成功" if result['success'] else "❌ 失敗"
        print(f"{status} ASIN: {result['asin']}")
        print(f"   メッセージ: {result['message']}")
        if result['success']:
            print(f"   楽天URL: {result['rakuten_url']}")
            print(f"   GOLDページ: {result['gold_page_path']}")
        print()
    
    # 処理状況サマリー
    status = automation_system.get_processing_status()
    print("処理状況サマリー:")
    print("=" * 50)
    print(f"完了商品数: {status['completed_products']}")
    print(f"失敗商品数: {status['failed_products']}")
    print(f"総処理数: {status['total_processed']}")

if __name__ == "__main__":
    # 環境変数設定の確認
    required_env_vars = [
        'PRODUCT_DATA_API_KEY',
        'GEMINI_API_KEY',
        'RAKUTEN_SERVICE_SECRET',
        'RAKUTEN_LICENSE_KEY'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print("⚠️ 以下の環境変数が設定されていません:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n.env ファイルに設定してから実行してください。")
    else:
        # 非同期メイン関数実行
        asyncio.run(main())
