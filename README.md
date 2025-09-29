# Telegram Hello World Bot

A simple and well-structured Telegram bot built with Node.js that demonstrates best practices for bot development, including memory storage for user information.

## Features

- 🤖 Simple Hello World functionality
- 💾 Hybrid storage (Memory + MongoDB)
- 🗄️ MongoDB integration with Mongoose ODM
- 📊 User statistics and bot analytics
- 🎯 Interactive buttons and commands
- 📝 Comprehensive logging
- 🏗️ Clean, modular architecture
- 🔧 Environment-based configuration
- 🛡️ Error handling and graceful shutdown
- 🐳 Docker containerization with Compose
- 🔄 Automatic data synchronization

## Project Structure

```
src/
├── config/           # Configuration files
│   └── index.js     # Main configuration
├── controllers/      # Request controllers (for future web endpoints)
├── handlers/         # Message handlers (for future expansion)
├── middleware/       # Middleware functions
├── models/          # Data models
├── services/        # Business logic services
│   ├── botService.js      # Main bot service
│   └── memoryStorage.js   # User memory storage
├── utils/           # Utility functions
│   └── logger.js    # Logging utility
└── index.js         # Application entry point
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- A Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))
- MongoDB (v4.4 or higher) - Optional, can use Docker
- Docker & Docker Compose - Optional, for containerized deployment

### Installation

1. **Clone or download this project**
   ```bash
   git clone <your-repo-url>
   cd telegram-hello-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   BOT_NAME=HelloWorldBot
   BOT_USERNAME=your_bot_username
   MONGODB_URI=mongodb://localhost:27017/telegram_bot
   MONGODB_DATABASE=telegram_bot
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Bot Commands

- `/start` - Start the bot and see welcome message
- `/hello` - Get a friendly greeting
- `/help` - Show help message with all commands
- `/stats` - Show bot statistics
- `/info` - Show your stored information

## Features Explained

### Hybrid Storage System
The bot uses a hybrid storage system that combines:
- **Memory Storage**: Fast access for active users
- **MongoDB**: Persistent storage with data validation
- **Automatic Sync**: Data synchronized between memory and database
- **User Management**: Stores user information (name, username, language, etc.)
- **Chat Tracking**: Tracks chat information and activity
- **Statistics**: Comprehensive analytics and performance metrics
- **Cleanup**: Automatically cleans up inactive users (after 7 days)

### Architecture Benefits
- **Modular Design**: Each component has a single responsibility
- **Scalable**: Easy to add new features and handlers
- **Maintainable**: Clear separation of concerns
- **Testable**: Services can be easily unit tested
- **Configurable**: Environment-based configuration

### Logging
Comprehensive logging system that:
- Logs all bot interactions
- Provides different log levels (info, error, warn, debug)
- Includes structured data for easy parsing
- Adapts to development vs production environments

## Development

### Adding New Commands

1. Add command handling in `src/services/botService.js`
2. Update help message with new command
3. Test the functionality

### Adding New Features

1. Create new services in `src/services/`
2. Add handlers in `src/handlers/` if needed
3. Update configuration in `src/config/`
4. Add appropriate logging

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | Yes | - |
| `BOT_NAME` | Display name for your bot | No | HelloWorldBot |
| `BOT_USERNAME` | Bot username | No | helloworld_bot |
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Port for web server (future use) | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | No | mongodb://localhost:27017/telegram_bot |
| `MONGODB_DATABASE` | MongoDB database name | No | telegram_bot |
| `USE_WEBHOOK` | Enable webhook mode | No | false |
| `WEBHOOK_DOMAIN` | Domain for webhook (required if USE_WEBHOOK=true) | No | - |
| `WEBHOOK_PATH` | Webhook endpoint path | No | /webhook |
| `WEBHOOK_PORT` | Port for webhook server | No | 3000 |

## Production Deployment

### Using Docker Compose (Recommended)

1. **Quick Setup**:
   ```bash
   # Copy environment template
   cp env.docker .env
   
   # Edit .env with your bot token
   nano .env
   
   # Run setup script
   ./scripts/docker-setup.sh
   ```

2. **Manual Setup**:
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```

3. **Services Included**:
   - Telegram Bot Application (with webhook support)
   - MongoDB Database
   - Mongo Express (Web UI at http://localhost:8081)

### Webhook Configuration

For production deployments with webhooks:

1. **Set up environment variables**:
   ```bash
   USE_WEBHOOK=true
   WEBHOOK_DOMAIN=your-domain.com
   WEBHOOK_PATH=/webhook
   WEBHOOK_PORT=3000
   ```

2. **Set up webhook**:
   ```bash
   ./scripts/webhook-setup.sh
   ```

3. **Test webhook**:
   ```bash
   node scripts/test-webhook.js
   ```

**Requirements for webhooks**:
- Valid SSL certificate (HTTPS)
- Publicly accessible domain
- Port 3000 (or configured port) open

### Development with Docker

For development, you can run only MongoDB in Docker:

```bash
# Start MongoDB for development
./scripts/docker-dev.sh

# Run bot locally
npm run dev
```

### Using PM2

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create ecosystem file:
   ```bash
   pm2 init
   ```

3. Start with PM2:
   ```bash
   pm2 start src/index.js --name telegram-bot
   ```

### Using Docker (Standalone)

```bash
# Build image
docker build -t telegram-bot .

# Run container
docker run -d \
  --name telegram-bot \
  --env-file .env \
  telegram-bot
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own Telegram bots!

## Support

If you have questions or need help:
1. Check the code comments
2. Review the logging output
3. Open an issue in the repository

---

**Happy Bot Building! 🤖✨**