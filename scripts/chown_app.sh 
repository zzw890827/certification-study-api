#!/bin/bash
set -e

# 要把 /home/ubuntu/app 及其子目录都归属到 ubuntu:ubuntu
TARGET_DIR="/home/ubuntu/app"

# 只要目录存在，就批量改 owner
if [ -d "$TARGET_DIR" ]; then
  echo "Changing owner of $TARGET_DIR to ubuntu:ubuntu..."
  chown -R ubuntu:ubuntu "$TARGET_DIR"
else
  echo "Directory $TARGET_DIR does not exist; skipping chown"
fi

exit 0
