FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY env.sh /env.sh

RUN chmod +x /env.sh

EXPOSE 6001

ENV PORT 6001
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/env.sh"]

# CMD ["npm", "run", "dev"]
CMD ["node", "server.js"]