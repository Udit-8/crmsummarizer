   # Use official Node.js LTS image
   FROM node:18-alpine

   # Set working directory
   WORKDIR /app

   # Copy package.json and install dependencies
   COPY package.json ./
   RUN npm install

   # Copy the rest of the code
   COPY . .

   # Expose port (e.g., 3000)
   EXPOSE 3000

   # Run the app
   CMD ["node", "index.js"]