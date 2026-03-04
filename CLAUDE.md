# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

自宅 Raspberry Pi (Debian 11, Python 3.9) 上で動作する SwitchBot Hub Mini 操作用 Web アプリ。
FastAPI バックエンド + React フロントエンド。LAN 内専用（外部公開しない）。

## Commands

### バックエンド（ローカル開発）

```bash
# switchbot/ ディレクトリを起点として実行すること（uvicorn の import パスが backend.* のため）
cd switchbot/
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # SWITCHBOT_API_TOKEN / SWITCHBOT_API_SECRET / JWT_SECRET を設定
uvicorn backend.main:app --reload --port 8000
```

### フロントエンド（ローカル開発）

```bash
cd switchbot/frontend
npm install
npm run dev     # Vite dev server (port 5173)、/api は localhost:8000 にプロキシ
npm run build   # frontend/dist/ に静的ファイルを生成
```

### Pi へのデプロイ

```bash
# 開発PCで実行。フロントエンドをローカルビルド → rsync 転送 → pip install → サービス再起動
cd switchbot/
bash scripts/deploy.sh <Pi-IP>   # 初回
bash scripts/deploy.sh           # 2回目以降（.deploy_host に保存済みホストを使用）

# Pi 上で初回のみ: systemd サービス登録
ssh pi@<Pi-IP>
cd /home/pi/switchbot-controller && bash scripts/setup_service.sh
```

## Architecture

### 全体構成

```
ブラウザ → FastAPI (port 8000) → SwitchBot Cloud API (v1.1)
                ↓
            SQLite (data/app.db)
                ↓
          APScheduler（スケジュール自動実行）
```

- **フロントエンド配信**: `frontend/dist/` が存在する場合、FastAPI がキャッチオールルート (`/{full_path:path}`) で `index.html` を返す。`/assets` は `StaticFiles` でマウント。存在しない場合（開発時）は Vite dev server が担当。
- **起動ディレクトリ**: uvicorn は必ず `switchbot/` 直下から起動する（`backend.main:app` の import パスのため）。

### バックエンド (`backend/`)

| ファイル | 役割 |
|---|---|
| `main.py` | FastAPI アプリ、startup/shutdown フック（DB初期化・スケジューラ起動）、SPA キャッチオールルート |
| `config.py` | pydantic-settings による設定（`.env` または環境変数） |
| `database.py` | SQLite 接続（`get_connection()`）、テーブル作成、デフォルトユーザー作成 |
| `auth.py` | JWT 発行・検証、bcrypt パスワードハッシュ |
| `switchbot_api.py` | SwitchBot API v1.1 クライアント（HMAC-SHA256 署名） |
| `scheduler.py` | APScheduler ラッパー。スケジュール CRUD の都度 `register_schedule()` / `remove_schedule()` を呼んで同期 |
| `routers/` | auth / device / schedule / log / settings の 5 ルーター |
| `models/` | Pydantic リクエスト/レスポンスモデル |

### API ルート一覧

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/auth/login` | 不要 | JWT トークン取得 |
| POST | `/api/auth/change-password` | 必要 | パスワード変更 |
| GET | `/api/devices` | 必要 | デバイス一覧（SwitchBot API から取得） |
| POST | `/api/devices/{device_id}/command` | 必要 | デバイスにコマンド送信 |
| GET | `/api/schedules` | 必要 | スケジュール一覧 |
| POST | `/api/schedules` | 必要 | スケジュール作成 |
| PUT | `/api/schedules/{id}` | 必要 | スケジュール更新 |
| PATCH | `/api/schedules/{id}/toggle` | 必要 | スケジュール有効/無効切替 |
| DELETE | `/api/schedules/{id}` | 必要 | スケジュール削除 |
| GET | `/api/logs` | 必要 | 実行ログ（直近100件） |
| GET | `/api/settings/profile` | 必要 | プロフィール・APIトークン状態確認 |
| PUT | `/api/settings/token` | 必要 | SwitchBot APIトークン更新 |

### フロントエンド (`frontend/src/`)

**スタック**: React 18 + Vite 5 + Tailwind CSS + React Router v6 + axios

React Router v6 で 4 ページ構成:
- `/login` — ログイン画面（認証不要）
- `/` — Home: デバイス操作パネル（エアコン・テレビを `remoteType` で分類）
- `/automation` — スケジュール管理・実行ログ
- `/profile` — SwitchBot API トークン更新・パスワード変更

**認証フロー**: JWT を `localStorage` に保存。axios インターセプターで全リクエストに `Authorization: Bearer` を付与。401 で自動ログアウト（`frontend/src/api/client.js`）。

### データベーススキーマ（SQLite）

- `users`: ユーザー認証情報（`username`, `password_hash`）
- `settings`: KV ストア。`switchbot_token` / `switchbot_secret` を保存
- `schedules`: スケジュール定義。`schedule_type` は `'recurring'`（曜日指定）か `'once'`（日時指定）
- `execution_logs`: 実行ログ。`status` は `'success'` か `'failure'`

### SwitchBot API 認証

`switchbot_api.py:_build_headers()` で毎リクエスト時に HMAC-SHA256 署名を生成。
トークンの優先順位: **DBの settings テーブル** > **.env / 環境変数**（プロフィール画面から更新した値が優先）。

### スケジューラ

- 起動時に `load_schedules_from_db()` でDB全件を APScheduler に登録。
- スケジュール作成・更新・トグル・削除のたびに `register_schedule()` / `remove_schedule()` でジョブを即時同期。
- `once` タイプは実行成功後に `is_enabled = 0` へ自動更新。

## 重要な制約・注意点

- **bcrypt バージョン固定**: Python 3.9 + passlib 1.7.4 は `bcrypt>=4.0.0` と非互換（起動時クラッシュ）。`requirements.txt` に `bcrypt<4.0.0` を明示。
- **タイムゾーン**: スケジューラは全て `Asia/Tokyo` で動作。
- **エアコン setAll パラメータ形式**: `"{温度},{モード},{風量},{電源}"` — モード: 1=自動/2=冷房/3=除湿/4=送風/5=暖房、風量: 1=自動/2=弱/3=中/4=強。
- **デプロイ時の除外**: `.env`・`data/`・`venv/`・`frontend/node_modules/` は rsync 対象外（本番データを上書きしない）。
- **デフォルト認証情報**: 初回起動時に `admin` / `switchbot` でユーザー作成。初回ログイン後にプロフィール画面で変更すること。
- **SPA ルーティング**: React Router のパス（`/login` 等）を直接 URL 入力できるよう、`main.py` にキャッチオールルート `/{full_path:path}` を実装済み。`StaticFiles` の `html=True` では SPA フォールバックが機能しないため。
