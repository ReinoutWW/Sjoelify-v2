# Use Node.js ARM image as base
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies first (caching)
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 