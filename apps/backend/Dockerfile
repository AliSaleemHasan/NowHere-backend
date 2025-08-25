FROM node:24

WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install

COPY . .

# Install development tools globally if needed
# RUN npm install -g @nestjs/cli

EXPOSE 3000

CMD ["npm", "run", "start:dev"]