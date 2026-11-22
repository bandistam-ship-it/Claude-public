FROM node:22-alpine
ENV TZ=Europe/Bucharest HOST=0.0.0.0 PORT=8787 STATE_FILE=/data/state.json
RUN apk add --no-cache tzdata
WORKDIR /app
COPY . .
VOLUME /data
EXPOSE 8787
CMD ["node", "server/index.js"]
