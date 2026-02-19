FROM node:18-alpine
WORKDIR /app
# Copia os arquivos de dependência primeiro (otimiza o cache)
COPY package*.json ./
RUN npm install
# Copia o resto do código
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]