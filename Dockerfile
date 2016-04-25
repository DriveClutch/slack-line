FROM node:5.11.0-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY server-package.json /usr/src/app/package.json
RUN npm install
COPY slack-line/server.js /usr/src/app/
COPY slack-line/index.ejs /usr/src/app/
COPY slack-line/bundle.js /usr/src/app/dist/build/bundle.js

EXPOSE 3333

CMD ["npm","start"]
