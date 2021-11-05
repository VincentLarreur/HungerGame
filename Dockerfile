FROM node:8-alpine

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
CMD exec node /app/server/
