#!/bin/bash
# Pi 上で初回のみ実行: systemd サービスを登録する
# 実行場所: Pi の switchbot-controller ディレクトリ
set -e

PI_DIR="$(cd "$(dirname "$0")/.." && pwd)"

sed "s|/home/pi/switchbot-controller|${PI_DIR}|g" \
  "${PI_DIR}/scripts/switchbot-controller.service" \
  | sudo tee /etc/systemd/system/switchbot-controller.service > /dev/null

sudo systemctl daemon-reload
sudo systemctl enable switchbot-controller
sudo systemctl start switchbot-controller

echo "サービスを登録・起動しました"
echo "状態確認: sudo systemctl status switchbot-controller"
echo "ログ確認: journalctl -u switchbot-controller -f"
