{
  "apps": [
    {
      "name": "umunsi-backend",
      "script": "src/index.js",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "instances": "max",
      "exec_mode": "cluster",
      "error_file": "./logs/err.log",
      "out_file": "./logs/out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "max_memory_restart": "1G",
      "watch": false,
      "ignore_watch": ["node_modules", "uploads", "logs"],
      "env_production": {
        "NODE_ENV": "production"
      }
    }
  ]
}
