#!/bin/bash
cd /home/ubuntu/app
npm install
npm run build
pm2 stop focusup-app || true
pm2 start dist/main.js --name focusup-app
pm2 save
