# GitHubプッシュ手順書

## 現在の状況
✅ Gitリポジトリ初期化完了  
✅ 全ファイルコミット完了（27ファイル、9,850行）  
✅ リモートリポジトリ設定完了  
⏳ **認証が必要です**

## 手動でプッシュを完了する手順

### 方法1: Personal Access Token使用（推奨）

1. **GitHub Personal Access Tokenを作成**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" をクリック
   - Expiration: 適切な期間を選択
   - Scopes: `repo` にチェック
   - "Generate token" をクリックしてトークンをコピー

2. **プッシュコマンド実行**
   ```bash
   cd /home/ubuntu/policy-editor-prototype
   git push -u origin main
   ```
   
3. **認証情報入力**
   - Username: あなたのGitHubユーザー名
   - Password: 作成したPersonal Access Token

### 方法2: SSH Key使用

1. **SSH Keyを生成（まだない場合）**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **公開鍵をGitHubに追加**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   この内容をGitHub → Settings → SSH and GPG keys → New SSH key に追加

3. **リモートURLをSSHに変更してプッシュ**
   ```bash
   cd /home/ubuntu/policy-editor-prototype
   git remote set-url origin git@github.com:yujihama/edit_policydoc.git
   git push -u origin main
   ```

## プッシュされる内容

### ファイル構成
```
policy-editor-prototype/
├── README.md                    # セットアップ・使用方法
├── package.json                 # 依存関係・スクリプト
├── tsconfig.json               # TypeScript設定
├── vite.config.ts              # Vite設定
├── index.html                  # HTMLエントリーポイント
├── .gitignore                  # Git除外設定
├── src/
│   ├── client/                 # フロントエンド
│   │   ├── App.tsx            # メインアプリ
│   │   ├── main.tsx           # エントリーポイント
│   │   ├── components/        # Reactコンポーネント
│   │   │   ├── Editor/        # エディター関連
│   │   │   ├── Search/        # 検索関連
│   │   │   ├── AI/            # AI機能関連
│   │   │   └── Common/        # 共通コンポーネント
│   │   └── hooks/             # カスタムフック
│   ├── server/                # バックエンド
│   │   ├── index.ts           # サーバーメイン
│   │   ├── models/            # データモデル
│   │   ├── services/          # ビジネスロジック
│   │   ├── routes/            # APIルート
│   │   └── scripts/           # ユーティリティ
│   └── shared/                # 共通型定義
└── data/                      # データベース（.gitignoreで除外）
```

### 主要機能
- 🎯 Monaco Editorベースの高機能エディター
- 🔍 リアルタイム類似箇所検索（WebSocket）
- 🤖 AI支援による条項生成（gpt-4.1対応）
- 📚 文書管理とバージョン管理
- 💾 自動保存機能（2秒デバウンス）
- 🔄 WebSocketによるリアルタイム通信

### 技術スタック
- **Frontend**: React + TypeScript + Mantine UI + Monaco Editor
- **Backend**: Node.js + Express + TypeScript + SQLite
- **AI**: OpenAI API (gpt-4.1) + ダミーレスポンス機能
- **Communication**: WebSocket + REST API

## プッシュ後の確認

プッシュ完了後、以下のURLでリポジトリを確認できます：
https://github.com/yujihama/edit_policydoc

## 次のステップ

1. **リポジトリクローン**
   ```bash
   git clone https://github.com/yujihama/edit_policydoc.git
   cd edit_policydoc
   ```

2. **依存関係インストール**
   ```bash
   npm install
   ```

3. **データベース初期化**
   ```bash
   npm run init-db
   ```

4. **開発サーバー起動**
   ```bash
   npm run dev
   ```

5. **アクセス**
   - フロントエンド: http://localhost:5173
   - バックエンドAPI: http://localhost:3001

認証を完了してプッシュを実行してください。

