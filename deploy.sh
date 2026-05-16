#!/bin/bash

# 1. Собираем проект (Production build)
echo "Building project..."
npm run build

# 2. Перекидываем содержимое папки dist на сервер
# rsync -avz (archive, verbose, compress)
echo "Deploying files to server..."
scp -r ./dist/* web@84.54.29.68:/var/www/wbozalweb

echo "Done! Сайт обновлен."