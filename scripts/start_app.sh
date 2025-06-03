#!/bin/bash
set -e

APP_DIR="/home/ubuntu/app"
APP_NAME="focus-up-app"
NVM_DIR="/home/ubuntu/.nvm"
NODE_VERSION="v22.16.0"

export NVM_DIR="$NVM_DIR"

# 如果 nvm.sh 不存在，脚本会报错并退出
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # Load nvm
  # 这个命令会把 "node"、"npm" 等都加入 PATH
  source "$NVM_DIR/nvm.sh"
else
  echo "ERROR: 找不到 nvm.sh，确保 NVM 安装在 $NVM_DIR"
  exit 1
fi

# 切换到指定 Node 版本
nvm use "$NODE_VERSION"

cd "$APP_DIR" || return
npm install
echo "使用 PM2 启动 NestJS 应用：npm run start:prod"
pm2 start npm --name "$APP_NAME" -- run start:prod
pm2 save

echo "App 启动完成，进程名称：$APP_NAME"

exit 0
