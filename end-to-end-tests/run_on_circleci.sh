npm run start & \
cd end-to-end-tests && \
npm install && \
./node_modules/webdriver-manager/bin/webdriver-manager update && \
./node_modules/webdriver-manager/bin/webdriver-manager start & \
./scripts/env_vars.sh && \
eval "$(./scripts/env_vars.sh)" && \
curl $CBIOPORTAL_URL > /dev/null && \
sleep 5s && \
curl $CBIOPORTAL_URL > /dev/null && \
sleep 5s && \
curl $CBIOPORTAL_URL > /dev/null && \
sleep 20s && \
curl http://localhost:3000 > /dev/null && \
sleep 20s && \
cd end-to-end-tests && \
npm run test-webdriver-manager
