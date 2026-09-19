FROM node:22-alpine

WORKDIR /app

ENV FAIL_MODE=ok
ENV APP_VERSION=1.0.0

COPY package.json server.js ./

EXPOSE 3000

CMD ["npm", "start"]
