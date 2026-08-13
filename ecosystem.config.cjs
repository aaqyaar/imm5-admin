module.exports = {
  apps: [
    {
      name: "console-imm5-svc",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      env: {
        PORT: 3009,
        NODE_ENV: "production",
      },
    },
  ],
}
