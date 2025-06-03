#!/bin/bash
set -e

APP_DIR="/home/ubuntu/app"
APP_NAME="focus-up-app"
NVM_DIR="/home/ubuntu/.nvm"
NODE_VERSION="v22.16.0"   # 与你实际安装的版本保持一致

cd "$APP_DIR" || return
npm install
echo "使用 PM2 启动 NestJS 应用：npm run start:prod"
pm2 start "$NVM_DIR"/versions/node/"$NODE_VERSION"/bin/npm --name "$APP_NAME" -- run start:prod
pm2 save

echo "App 启动完成，进程名称：$APP_NAME"

exit 0
