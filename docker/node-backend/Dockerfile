FROM node:20

WORKDIR /app

COPY package.json tsconfig.json ./
COPY lib ./lib
COPY index.ts ./

RUN npm install -g pnpm && pnpm install
RUN pnpm tsc --outDir dist

CMD ["node", "dist/index.js"]
