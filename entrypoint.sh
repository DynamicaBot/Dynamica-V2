cd /app

MODIFIED_STARTUP=$(echo -e ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')
echo ":/app$ ${MODIFIED_STARTUP}"
eval ${MODIFIED_STARTUP}