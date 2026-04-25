name=Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || true
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm","start"]