FROM node:20-alpine

WORKDIR /app/backend
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY data ./data
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
