#!/bin/bash
cd /home/adityazyrogami/codereportglobal/apps/studio
npx vite --host 127.0.0.1 --port 5174 > vite_dev.log 2>&1 &
echo $! > vite_dev.pid
sleep 2
cat vite_dev.log
