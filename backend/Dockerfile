FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
    && npm ci \
    && apk del python3 make g++

COPY . .

RUN mkdir -p /app/data

VOLUME ["/app/data"]

EXPOSE 3001

CMD ["npm", "start"]
