#!/usr/bin/env node

/**
 * Webhook Test Script
 * Tests webhook functionality without starting the full bot
 */

const express = require('express');
const config = require('../src/config');
const Logger = require('../src/utils/logger');

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook configuration...');
    
    // Check configuration
    console.log('📋 Configuration:');
    console.log(`   - Webhook enabled: ${config.webhook.enabled}`);
    console.log(`   - Domain: ${config.webhook.domain || 'Not set'}`);
    console.log(`   - Path: ${config.webhook.path}`);
    console.log(`   - Port: ${config.webhook.port}`);
    
    if (!config.webhook.enabled) {
      console.log('⚠️  Webhook is disabled. Set USE_WEBHOOK=true to enable.');
      return;
    }
    
    if (!config.webhook.domain) {
      console.log('❌ WEBHOOK_DOMAIN is required for webhook mode.');
      return;
    }
    
    // Create test Express app
    const app = express();
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bot: config.bot.name,
        webhook: {
          enabled: config.webhook.enabled,
          domain: config.webhook.domain,
          path: config.webhook.path
        }
      });
    });
    
    // Test webhook endpoint
    app.post(config.webhook.path, (req, res) => {
      console.log('📨 Webhook received:', {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      res.json({ status: 'received' });
    });
    
    // Start test server
    const server = app.listen(config.webhook.port, () => {
      console.log(`✅ Test server started on port ${config.webhook.port}`);
      console.log(`🔗 Health check: http://localhost:${config.webhook.port}/health`);
      console.log(`🔗 Webhook endpoint: http://localhost:${config.webhook.port}${config.webhook.path}`);
      console.log('');
      console.log('📝 To test:');
      console.log(`   curl http://localhost:${config.webhook.port}/health`);
      console.log('');
      console.log('Press Ctrl+C to stop the test server');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping test server...');
      server.close(() => {
        console.log('✅ Test server stopped');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebhook();
