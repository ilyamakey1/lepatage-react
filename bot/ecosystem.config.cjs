// pm2: pm2 start /var/www/lepatage/bot/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: 'lepatage-bot',
      cwd: '/var/www/lepatage/bot',
      script: 'src/server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      restart_delay: 5000,
      time: true,
    },
  ],
};
