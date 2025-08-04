# main.py - 楽天GOLD自動化システム メイン実行ファイル
"""
楽天GOLD Rakuten Product Page Automation System
Amazon ASINから楽天商品ページを自動生成するシステム

使用方法:
    python main.py gui          # GUI版起動
    python main.py cli          # コマンドライン版起動
    python main.py batch        # バッチ処理版起動
    python main.py setup        # 初期セットアップ
    python main.py test         # システムテスト

作成者: EC自動化システム開発チーム
バージョン: 1.0.0
最終更新: 2025-08-04
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path
import json
import csv
from datetime import datetime
import logging

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rakuten_automation.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RakutenAutomationCLI:
    """コマンドライン版インターフェース"""
    
    def __init__(self):
        self.system = None
        
    def init_system(self):
        """システム初期化"""
        try:
            # 環境変数チェック
            required_vars = [
                'PRODUCT_DATA_API_KEY',
                'GEMINI_API_KEY', 
                'RAKUTEN_SERVICE_SECRET',
                'RAKUTEN_LICENSE_KEY'
            ]
            
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            if missing_vars:
                print("❌ 以下の環境変数が設定されていません:")
                for var in missing_vars:
                    print(f"   - {var}")
                print("\n.env ファイルを確認してください。")
                return False
            
            from rakuten_gold_automation import RakutenGoldAutomationSystem
            self.system = RakutenGoldAutomationSystem()
            logger.info("✅ システム初期化完了")
            return True
            
        except Exception as e:
            logger.error(f"❌ システム初期化エラー: {e}")
            return False
    
    async def process_single_asin(self, asin: str):
        """単一ASIN処理"""
        if not self.init_system():
            return
        
        print(f"🚀 ASIN処理開始: {asin}")
        result = await self.system.process_asin(asin)
        
        if result['success']:
            print(f"✅ 処理成功: {asin}")
            print(f"   楽天URL: {result['rakuten_url']}")
            print(f"   GOLDページ: {result['gold_page_path']}")
        else:
            print(f"❌ 処理失敗: {asin}")
            print(f"   エラー: {result['message']}")
        
        return result
    
    async def process_asin_list(self, asin_list: list):
        """複数ASIN処理"""
        if not self.init_system():
            return
        
        print(f"🚀 一括処理開始: {len(asin_list)}件")
        results = await self.system.bulk_process_asins(asin_list)
        
        # 結果サマリー
        success_count = sum(1 for r in results if r['success'])
        print(f"\n📊 処理結果:")
        print(f"   成功: {success_count}/{len(asin_list)}件")
        print(f"   失敗: {len(asin_list) - success_count}件")
        
        # 結果詳細
        for result in results:
            status = "✅" if result['success'] else "❌"
            print(f"   {status} {result['asin']}: {result['message']}")
        
        return results
    
    async def process_csv_file(self, csv_path: str):
        """CSVファイル一括処理"""
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                asins = [row[0].strip() for row in reader if row and row[0].strip()]
            
            print(f"📁 CSVファイルから{len(asins)}件のASINを読み込みました")
            return await self.process_asin_list(asins)
            
        except Exception as e:
            logger.error(f"❌ CSVファイル処理エラー: {e}")
            print(f"❌ CSVファイル処理エラー: {e}")
            return []

def setup_system():
    """初期セットアップ"""
    print("🔧 楽天GOLD自動化システム 初期セットアップ")
    print("=" * 50)
    
    # 必要なディレクトリ作成
    directories = [
        "templates",
        "output/rakuten_pages", 
        "output/results",
        "input",
        "logs"
    ]
    
    for dir_path in directories:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✅ ディレクトリ作成: {dir_path}")
    
    # .env.example があれば .env にコピー
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if env_example.exists() and not env_file.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ .env ファイル作成完了")
        print("⚠️  .env ファイルに実際のAPIキーを設定してください")
    
    # テンプレートファイル確認
    template_path = Path("templates/rakuten_gold_template.html")
    if not template_path.exists():
        print("⚠️  テンプレートファイルが見つかりません")
        print("   rakuten_gold_template.html を templates/ フォルダに配置してください")
    else:
        print("✅ テンプレートファイル確認完了")
    
    print("\n🎉 セットアップ完了!")
    print("次の手順:")
    print("1. .env ファイルにAPIキーを設定")
    print("2. python main.py test でシステムテスト実行")
    print("3. python main.py gui でGUI起動")

def test_system():
    """システムテスト"""
    print("🧪 システムテスト実行")
    print("=" * 50)
    
    # 環境変数チェック
    required_vars = [
        'PRODUCT_DATA_API_KEY',
        'GEMINI_API_KEY',
        'RAKUTEN_SERVICE_SECRET', 
        'RAKUTEN_LICENSE_KEY'
    ]
    
    print("📋 環境変数チェック:")
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: 設定済み")
        else:
            print(f"   ❌ {var}: 未設定")
    
    # ファイル・ディレクトリチェック
    print("\n📁 ファイル・ディレクトリチェック:")
    check_paths = [
        "rakuten_gold_automation.py",
        "templates/",
        "output/"
    ]
    
    for path in check_paths:
        if Path(path).exists():
            print(f"   ✅ {path}: 存在")
        else:
            print(f"   ❌ {path}: 見つからない")
    
    # システム初期化テスト
    print("\n⚙️ システム初期化テスト:")
    try:
        from rakuten_gold_automation import RakutenGoldAutomationSystem
        system = RakutenGoldAutomationSystem()
        print("   ✅ システム初期化: 成功")
        
        # データベース接続テスト
        status = system.get_processing_status()
        print(f"   ✅ データベース接続: 成功")
        print(f"   📊 処理済み商品数: {status['completed_products']}")
        
    except Exception as e:
        print(f"   ❌ システム初期化: 失敗 - {e}")
    
    print("\n🎯 テスト完了")

def create_sample_files():
    """サンプルファイル作成"""
    print("📝 サンプルファイル作成中...")
    
    # サンプルCSVファイル
    sample_csv_path = Path("input/sample_asin_list.csv")
    sample_csv_path.parent.mkdir(parents=True, exist_ok=True)
    
    sample_asins = [
        "B07XJ8C8F5",  # Echo Dot
        "B085KNRR34",  # Fire TV Stick  
        "B08N5WRWNW",  # Echo Show 5
        "B07HZLHPKP",  # Fire HD 8
        "B08KKM68B3"   # Echo Auto
    ]
    
    with open(sample_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ASIN'])  # ヘッダー
        for asin in sample_asins:
            writer.writerow([asin])
    
    print(f"✅ サンプルCSVファイル作成: {sample_csv_path}")
    
    # .env.example 作成
    env_example_content = """# 楽天GOLD自動化システム API設定
# 各APIキーを取得して設定してください

# Amazon Product Data API (第三者API)
PRODUCT_DATA_API_KEY=your_product_data_api_key_here

# Google Gemini AI API
GEMINI_API_KEY=your_gemini_api_key_here

# 楽天RMS API設定
RAKUTEN_SERVICE_SECRET=your_rakuten_service_secret_here
RAKUTEN_LICENSE_KEY=your_rakuten_license_key_here

# オプション: Claude AI API (高度な分析用)
CLAUDE_API_KEY=your_claude_api_key_here
"""
    
    with open(".env.example", "w", encoding="utf-8") as f:
        f.write(env_example_content)
    
    print("✅ .env.example作成完了")
    
    # requirements.txt作成
    requirements_content = """# 楽天GOLD自動化システム 必要ライブラリ
aiohttp==3.9.3
requests==2.31.0
google-generativeai==0.3.2
python-dotenv==1.0.1
asyncio

# GUI用ライブラリ
tkinter

# オプション（より高度な機能用）
pandas==2.2.0
"""
    
    with open("requirements.txt", "w", encoding="utf-8") as f:
        f.write(requirements_content)
    
    print("✅ requirements.txt作成完了")

def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="楽天GOLD商品ページ自動生成システム",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python main.py gui                          # GUI版起動
  python main.py cli --asin B07XJ8C8F5        # 単一ASIN処理
  python main.py cli --csv input/asins.csv    # CSVファイル処理
  python main.py setup                        # 初期セットアップ
  python main.py test                         # システムテスト
  python main.py samples                      # サンプルファイル作成
        """
    )
    
    parser.add_argument('mode', choices=['gui', 'cli', 'setup', 'test', 'samples'],
                       help='実行モード')
    parser.add_argument('--asin', type=str, help='処理するASIN')
    parser.add_argument('--asin-list', type=str, help='カンマ区切りのASINリスト')
    parser.add_argument('--csv', type=str, help='ASINリストCSVファイルパス')
    parser.add_argument('--verbose', '-v', action='store_true', help='詳細ログ出力')
    
    args = parser.parse_args()
    
    # ログレベル設定
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # .env ファイル読み込み
    env_file = Path('.env')
    if env_file.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            print("⚠️  python-dotenv がインストールされていません")
            print("pip install python-dotenv を実行してください")
    
    try:
        if args.mode == 'gui':
            print("🖥️  GUI版を起動しています...")
            try:
                from config_and_runner import RakutenAutomationGUI
                app = RakutenAutomationGUI()
                app.run()
            except ImportError:
                print("❌ GUIモジュールが見つかりません")
                print("config_and_runner.py ファイルを確認してください")
        
        elif args.mode == 'cli':
            print("💻 CLI版を起動しています...")
            cli = RakutenAutomationCLI()
            
            if args.asin:
                asyncio.run(cli.process_single_asin(args.asin))
            elif args.asin_list:
                asin_list = [asin.strip() for asin in args.asin_list.split(',')]
                asyncio.run(cli.process_asin_list(asin_list))
            elif args.csv:
                asyncio.run(cli.process_csv_file(args.csv))
            else:
                print("❌ --asin, --asin-list, または --csv のいずれかを指定してください")
                parser.print_help()
        
        elif args.mode == 'setup':
            setup_system()
        
        elif args.mode == 'test':
            test_system()
        
        elif args.mode == 'samples':
            create_sample_files()
        
    except KeyboardInterrupt:
        print("\n⏹️  ユーザーによって処理が中断されました")
    except Exception as e:
        logger.error(f"❌ 実行エラー: {e}")
        print(f"❌ 実行エラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # バナー表示
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║           楽天GOLD商品ページ自動生成システム v1.0             ║
    ║     Amazon ASIN → 楽天商品ページ 完全自動化ソリューション      ║
    ║                                                              ║
    ║  🚀 作業時間83%削減  💰 売上向上  🤖 AI最適化  📊 一括処理   ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    main()
