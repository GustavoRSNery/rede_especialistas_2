# =========================================================
# Estágio 1 — Build React com Vite
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev=false

COPY . .

# Injeta a variável em tempo de build para o Vite
ARG VITE_BACKEND_API_URL=/backend/api
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}

RUN npm run build

# =========================================================
# Estágio 2 — BFF Express (Node 20) + assets estáticos
# =========================================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Copia apenas as dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o servidor BFF e os módulos server-side
COPY server.js ./
COPY lib/ ./lib/
COPY queue/ ./queue/
COPY cache/ ./cache/

# Copia os assets compilados pelo Vite (output: /app/dist)
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "server.js"]

