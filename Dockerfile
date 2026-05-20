FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p public/uploads/images \
             public/uploads/mods \
             public/uploads/avatars

EXPOSE 3000

CMD ["node", "app.js"]
