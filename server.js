const app = require('./src/app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 5000;
const MY_IP = process.env.MY_IP || '10.205.101.2';
const WIFI_IP = process.env.WIFI_IP || '192.168.1.29';

// Test database connection and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected...'); 
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
         console.log(`🔗 MY IP URL: http://${MY_IP}:${PORT}/api`);
          console.log(`🔗 WIFI URL: http://${WIFI_IP}:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
};

startServer();