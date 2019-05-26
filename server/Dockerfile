FROM mhart/alpine-node:8.14.1

RUN apk add --update --no-cache build-base curl bash libc6-compat python && rm -rf /var/cache/apk/* && mkdir -p /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
ADD . /app
RUN npm run build

HEALTHCHECK CMD curl --fail http://localhost:4000/ || exit 1

EXPOSE 4000

CMD ["node", "dist/app.js"]
