FROM node:22-alpine

WORKDIR /app

ENV FAIL_MODE=crash
ENV APP_VERSION=2.0.0

COPY package.json server.js ./

EXPOSE 3000

CMD ["npm", "start"]
