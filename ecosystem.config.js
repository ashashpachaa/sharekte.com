module.exports = {
  apps: [
    {
      name: "sharekte",
      script: "./dist/server/node-build.mjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
        AIRTABLE_API_TOKEN: process.env.AIRTABLE_API_TOKEN,
        VITE_AIRTABLE_API_TOKEN: process.env.VITE_AIRTABLE_API_TOKEN,
        AIRTABLE_TABLE_TRANSFER_FORMS: process.env.AIRTABLE_TABLE_TRANSFER_FORMS,
      },
      error_file: "/var/log/sharekte-error.log",
      out_file: "/var/log/sharekte-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "500M",
      watch: false,
      ignore_watch: ["node_modules", "dist", ".git"],
      shutdown_delay: 5000,
    },
  ],
};
