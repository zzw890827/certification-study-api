#!/bin/bash
set -e

APP_DIR="/home/ubuntu/app"
APP_NAME="focus-up-app"

cd "$APP_DIR" || return

if pm2 list | grep -q "$APP_NAME"; then
  echo "PM2 进程 $APP_NAME 已存在，先停止并删除……"
  pm2 stop "$APP_NAME" || true
  pm2 delete "$APP_NAME" || true
fi

exit 0
