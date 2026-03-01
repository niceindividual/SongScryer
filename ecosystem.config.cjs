module.exports = {
  apps: [{
    name: 'songer',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PATH: './data/songer.db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_restarts: 10,
    restart_delay: 1000
  }]
};
