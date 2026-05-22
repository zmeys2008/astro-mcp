FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY api-server.cjs .
EXPOSE 8111
CMD ["node", "api-server.cjs"]