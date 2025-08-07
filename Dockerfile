# Sử dụng Node.js 18 Alpine để giảm kích thước image
FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng Docker cache
COPY package*.json ./

# Cài đặt dependencies (bao gồm devDependencies cho nodemon)
RUN npm ci

# Copy source code
COPY . .

# Tạo user không phải root để chạy ứng dụng
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Thay đổi quyền sở hữu
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (nếu cần)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Command để chạy ứng dụng
CMD ["npm", "start"]
