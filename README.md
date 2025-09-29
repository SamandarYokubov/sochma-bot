# Sochma Bot 🤖

A professional Telegram bot for the Sochma platform, designed to connect investors and buyers in a seamless, user-friendly environment.

## 🚀 Features

- **User Management**: Complete user registration, profile management, and authentication
- **Smart Search**: Advanced search functionality for finding investors and buyers
- **Profile System**: Comprehensive user profiles with company, industry, and contact information
- **Real-time Communication**: Direct messaging and connection requests
- **Analytics**: User activity tracking and platform statistics
- **Multi-language Support**: Internationalization ready
- **Rate Limiting**: Built-in protection against spam and abuse
- **Error Handling**: Comprehensive error handling and logging
- **Database Integration**: MongoDB integration with Mongoose ODM
- **API Integration**: Seamless integration with Sochma platform API

## 🏗️ Architecture

The bot follows a modular, scalable architecture with clear separation of concerns:

```
src/
├── config/           # Configuration management
├── controllers/      # Main bot controller
├── handlers/         # Command and callback handlers
├── middleware/       # Custom middleware
├── models/          # Database models
├── services/        # Business logic services
├── utils/           # Utility functions
└── index.js         # Application entry point
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Telegraf.js 4.x
- **Database**: MongoDB with Mongoose
- **Logging**: Winston
- **Validation**: Joi
- **Environment**: dotenv
- **HTTP Client**: Axios
- **Scheduling**: node-cron

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Sochma Platform API access

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/sochma-bot.git
cd sochma-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
BOT_USERNAME=your_bot_username

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sochma_bot

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info

# Sochma Platform API
SOCHMA_API_URL=https://api.sochma.com
SOCHMA_API_KEY=your_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### 4. Start the Bot

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## 📚 Available Commands

### User Commands

- `/start` - Initialize the bot and set up your profile
- `/profile` - View and edit your profile
- `/search` - Search for investors and buyers
- `/help` - Get help and documentation
- `/settings` - Manage bot settings
- `/stats` - View your account statistics
- `/contact` - Contact support

### Bot Features

- **Profile Management**: Complete profile setup with company, industry, location, and bio
- **User Types**: Support for investors, buyers, or both
- **Advanced Search**: Search by user type, industry, location, and investment range
- **Connection System**: Request connections and manage your network
- **Notifications**: Real-time notifications for important events
- **Analytics**: Track your activity and engagement

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BOT_TOKEN` | Telegram bot token | Yes | - |
| `BOT_USERNAME` | Bot username | Yes | - |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `LOG_LEVEL` | Logging level | No | info |
| `SOCHMA_API_URL` | Sochma platform API URL | Yes | - |
| `SOCHMA_API_KEY` | Sochma platform API key | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `ENCRYPTION_KEY` | Data encryption key | Yes | - |

### Database Models

#### User Model
- Basic user information (name, username, Telegram ID)
- Profile data (company, industry, location, bio)
- User preferences and settings
- Subscription and verification status
- Activity tracking

#### Conversation Model
- Conversation state management
- User interaction tracking
- Command and callback handling
- Context preservation

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

1. **Using PM2** (Recommended):
```bash
npm install -g pm2
pm2 start src/index.js --name sochma-bot
pm2 startup
pm2 save
```

2. **Using Docker**:
```bash
docker build -t sochma-bot .
docker run -d --name sochma-bot --env-file .env sochma-bot
```

3. **Using systemd**:
```bash
sudo systemctl enable sochma-bot
sudo systemctl start sochma-bot
```

### Webhook Setup (Production)

For production deployments, configure webhooks:

```env
WEBHOOK_URL=https://yourdomain.com/webhook
WEBHOOK_PORT=8443
WEBHOOK_CERT_PATH=/path/to/cert.pem
WEBHOOK_KEY_PATH=/path/to/private.key
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 📊 Monitoring

### Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Health Checks

The bot provides health check endpoints:
- Database connection status
- Sochma API connectivity
- Bot status and statistics

## 🔒 Security

- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error handling without information leakage
- **Data Encryption**: Sensitive data encryption support
- **Access Control**: User permission and role-based access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📝 API Documentation

### Sochma Platform Integration

The bot integrates with the Sochma platform API for:
- User profile synchronization
- Search functionality
- Connection management
- Analytics and reporting

### Webhook Endpoints

- `POST /webhook` - Telegram webhook endpoint
- `GET /health` - Health check endpoint
- `GET /stats` - Bot statistics endpoint

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**:
   - Check bot token validity
   - Verify webhook configuration
   - Check logs for errors

2. **Database connection issues**:
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure MongoDB is running

3. **API integration problems**:
   - Verify API credentials
   - Check API endpoint availability
   - Review rate limiting

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-org/sochma-bot/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/sochma-bot/issues)
- **Email**: support@sochma.com
- **Telegram**: [@sochma_support](https://t.me/sochma_support)

## 🙏 Acknowledgments

- [Telegraf.js](https://telegraf.js.org/) - Telegram Bot Framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Winston](https://github.com/winstonjs/winston) - Logging
- [Joi](https://joi.dev/) - Validation

---

**Made with ❤️ by the Sochma Team**
