# build stage
FROM node:25-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_PROGRAM_ID
ARG VITE_ROUTER_ADDRESS
ARG VITE_WVARA_ADDRESS
ARG VITE_VARA_ETH_WS
ARG VITE_VARA_ETH_HTTP
ARG VITE_API_URL

ENV VITE_PROGRAM_ID=${VITE_PROGRAM_ID} \
    VITE_ROUTER_ADDRESS=${VITE_ROUTER_ADDRESS} \
    VITE_WVARA_ADDRESS=${VITE_WVARA_ADDRESS} \
    VITE_VARA_ETH_WS=${VITE_VARA_ETH_WS} \
    VITE_VARA_ETH_HTTP=${VITE_VARA_ETH_HTTP} \
    VITE_API_URL=${VITE_API_URL} \
    DISABLE_ESLINT_PLUGIN=true

RUN npm run build

# run stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html/one-of-us
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
