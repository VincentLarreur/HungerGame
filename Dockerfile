FROM node:8-alpine

# Install nginx
RUN apk --no-cache add nginx

# Copy application & configuration
COPY . /app/
COPY docker-nginx.conf /etc/nginx/nginx.conf
COPY package.json /
COPY package-lock.json /

# Install node packages
RUN npm install

# Default socket.io path
ENV SOCKET_IO_PATH /socket.io

# Run start script
CMD sed -i "s|var server_uri.*|var server_uri = '$SERVER_URI';|" /app/client/hg_client.js && nginx && exec node /app/server/

# Default port 8000
EXPOSE 8000
