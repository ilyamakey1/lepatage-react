module.exports = {
  apps: [
    {
      name: 'lepatage-api',
      script: './server/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx/esm',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      autorestart: true,
      kill_timeout: 5000,
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/lepatage',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && npm run db:migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

