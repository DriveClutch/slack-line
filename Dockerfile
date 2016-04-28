FROM node:5.11.0-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY dist/slack-line/server-package.json /usr/src/app/package.json
RUN npm install
COPY dist/slack-line/server.js /usr/src/app/
COPY dist/slack-line/index.ejs /usr/src/app/
COPY dist/slack-line/bundle.js /usr/src/app/dist/build/bundle.js

EXPOSE 3333

CMD ["npm","start"]
