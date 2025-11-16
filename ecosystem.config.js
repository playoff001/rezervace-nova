// PM2 konfigurace pro správu procesů v produkci
// Instalace: npm install -g pm2
// Spuštění: pm2 start ecosystem.config.js
// Status: pm2 status
// Logy: pm2 logs
// Restart: pm2 restart rezervace

module.exports = {
  apps: [{
    name: 'rezervace',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};



