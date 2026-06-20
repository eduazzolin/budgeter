# Stage 1: Build the React Application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install project dependencies
RUN npm ci

# Copy the entire codebase
COPY . .

# Compile the application for production
RUN npm run build

# Stage 2: Serve the assets using Nginx
FROM nginx:alpine

# Copy build artifacts to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template
# The Nginx Docker entrypoint will automatically perform envsubst 
# on this file and output the final configuration to /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy script to inject runtime environment variables into index.html
COPY 40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

# Default Cloud Run port expectation (8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
