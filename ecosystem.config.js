module.exports = {
  apps: [{
    name: 'induccion-rrhh',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: { NODE_ENV: 'production' },
    error_file: './backups/pm2-error.log',
    out_file: './backups/pm2-out.log',
    time: true,
  }],
};
