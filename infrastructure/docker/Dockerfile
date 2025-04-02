FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install only production dependencies to minimize image size
RUN npm install --production

# Copy application code
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "index.js"]