FROM node:24

WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install

COPY . .
EXPOSE 3002


CMD [ "npm","run","start:storage:dev" ]