FROM node:lts-alpine

# Create app directory
WORKDIR /container/app

# required because a bug on ncc that does not interpret
# correclty some dynamic requires that nconf uses
# for ncc v 0.20.5 bug https://github.com/zeit/ncc/issues/451
# RUN npm i --no-save nconf

# COPY bundle .
# COPY .env.example ./.env.example

EXPOSE 3002
CMD [ "echo", "hello world" ]
