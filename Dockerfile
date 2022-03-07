FROM node:16-alpine AS builder
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
RUN npm audit fix --force
EXPOSE 4002
COPY . .

FROM node:16-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app . 
CMD ["node", "index.js"]
