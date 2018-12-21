FROM node:alpine

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm i

# Bundle app source
COPY . .

CMD ["npm", "start"]