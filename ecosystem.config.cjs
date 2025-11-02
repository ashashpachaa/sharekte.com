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
        AIRTABLE_API_TOKEN:
          "patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded",
        VITE_AIRTABLE_API_TOKEN:
          "patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded",
        AIRTABLE_TABLE_TRANSFER_FORMS: "tblK7lUO1cfNFYO14",
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
