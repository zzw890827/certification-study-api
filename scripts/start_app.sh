#!/bin/bash

APP_NAME="focus-up-app"

cd /home/ubuntu/app || return
npm install
echo "使用 PM2 启动 NestJS 应用：npm run start:prod"
pm2 start npm --name "$APP_NAME" -- run start:prod
pm2 save

echo "App 启动完成，进程名称：$APP_NAME"

exit 0
