   # Use official Node.js LTS image
   FROM node:18-alpine

   # working directory should be services/api
   WORKDIR /services/api
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npx prisma generate

   # Expose port (e.g., 3000)
   EXPOSE 3000

   # Run the app
   CMD ["node", "index.js"]