#!/bin/bash
# 使い方: ./scripts/deploy.sh [pi-host]
#   pi-host: デフォルト raspberrypi.local（または Pi の IP アドレス）
#
# 初回: ./scripts/deploy.sh 192.168.1.xxx
# 2回目以降: ./scripts/deploy.sh  （前回のホストを .deploy_host に保存）

set -e
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# ---- ホスト解決 ----
HOST="${1:-}"
SAVED_HOST_FILE="$REPO_DIR/.deploy_host"

if [ -z "$HOST" ]; then
  if [ -f "$SAVED_HOST_FILE" ]; then
    HOST="$(cat "$SAVED_HOST_FILE")"
    echo "前回のホストを使用: $HOST"
  else
    echo "使い方: $0 <pi-ip-or-hostname>"
    echo "例:     $0 192.168.1.100"
    echo "例:     $0 raspberrypi.local"
    exit 1
  fi
fi

PI_USER="${PI_USER:-pi}"
PI_DIR="${PI_DIR:-/home/pi/switchbot-controller}"
SSH_TARGET="${PI_USER}@${HOST}"

echo "$HOST" > "$SAVED_HOST_FILE"

echo "=== デプロイ先: ${SSH_TARGET}:${PI_DIR} ==="

# ---- 1. フロントエンドをローカルでビルド ----
echo "[1/4] フロントエンドをビルド中..."
cd "$REPO_DIR/frontend"
if [ ! -d node_modules ]; then
  npm install --silent
fi
npm run build
cd "$REPO_DIR"
echo "      -> frontend/dist/ を生成しました"

# ---- 2. Pi 側にディレクトリ作成 ----
echo "[2/4] Pi 側のディレクトリを準備中..."
ssh "${SSH_TARGET}" "mkdir -p ${PI_DIR}/data"

# ---- 3. rsync で転送 ----
echo "[3/4] ファイルを転送中..."
rsync -az --delete \
  --exclude='.git/' \
  --exclude='.DS_Store' \
  --exclude='*.pyc' \
  --exclude='__pycache__/' \
  --exclude='venv/' \
  --exclude='frontend/node_modules/' \
  --exclude='.env' \
  --exclude='data/' \
  --exclude='.deploy_host' \
  "$REPO_DIR/" \
  "${SSH_TARGET}:${PI_DIR}/"

echo "      -> 転送完了"

# ---- 4. Pi 側で依存関係インストール & サービス再起動 ----
echo "[4/4] Pi 側でセットアップ中..."
ssh "${SSH_TARGET}" bash <<REMOTE
  set -e
  cd "${PI_DIR}"

  # 初回のみ: venv 作成・.env 作成
  if [ ! -d venv ]; then
    echo "  -> Python 仮想環境を作成"
    python3 -m venv venv
  fi

  if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "  [!] .env が未作成のため .env.example からコピーしました"
    echo "      以下のコマンドで API トークンを設定してください:"
    echo "      ssh ${SSH_TARGET} nano ${PI_DIR}/.env"
    echo ""
  fi

  # Python パッケージ更新
  venv/bin/pip install --quiet -r requirements.txt

  # systemd サービスが存在する場合は再起動、なければ登録を案内
  if systemctl is-active --quiet switchbot-controller 2>/dev/null; then
    sudo systemctl restart switchbot-controller
    echo "  -> サービスを再起動しました"
  elif systemctl list-unit-files switchbot-controller.service &>/dev/null; then
    sudo systemctl start switchbot-controller
    echo "  -> サービスを起動しました"
  else
    echo "  -> systemd サービスが未登録です。初回は以下を実行してください:"
    echo "     ssh ${SSH_TARGET}"
    echo "     cd ${PI_DIR} && bash scripts/setup_service.sh"
  fi

  echo "  -> 完了"
REMOTE

echo ""
echo "=== デプロイ完了 ==="
echo "    URL: http://${HOST}:8000"
echo "    ログ確認: ssh ${SSH_TARGET} 'journalctl -u switchbot-controller -f'"
