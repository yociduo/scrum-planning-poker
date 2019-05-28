FROM node:10.15.3-alpine

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
COPY ./ /app/
RUN npm run build-ts

EXPOSE 3000

EXPOSE 3001

CMD ["node", "dist/app.js"]
