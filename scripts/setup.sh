#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "=== SwitchBot Controller セットアップ ==="

# .env 作成
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[!] .env を作成しました。SWITCHBOT_API_TOKEN と SWITCHBOT_API_SECRET を設定してください:"
  echo "    nano .env"
fi

# Python 仮想環境
if [ ! -d venv ]; then
  echo "[1/4] Python 仮想環境を作成中..."
  python3 -m venv venv
fi
echo "[2/4] Python 依存関係をインストール中..."
venv/bin/pip install --quiet -r requirements.txt

# フロントエンドビルド
echo "[3/4] フロントエンドをビルド中..."
cd frontend
npm install --silent
npm run build
cd ..

# データディレクトリ
mkdir -p data
touch data/.gitkeep

echo "[4/4] systemd サービスをインストール中..."
if [ -f scripts/switchbot-controller.service ]; then
  sudo cp scripts/switchbot-controller.service /etc/systemd/system/
  sudo sed -i "s|/home/pi/switchbot-controller|$REPO_DIR|g" /etc/systemd/system/switchbot-controller.service
  sudo systemctl daemon-reload
  sudo systemctl enable switchbot-controller
  sudo systemctl restart switchbot-controller
  echo "=== 完了 ==="
  echo "ブラウザで http://$(hostname -I | awk '{print $1}'):8000 にアクセスしてください"
  echo "デフォルト認証情報: admin / switchbot"
else
  echo "systemd サービスファイルが見つかりません。手動で起動してください:"
  echo "  source venv/bin/activate && uvicorn backend.main:app --host 0.0.0.0 --port 8000"
fi
