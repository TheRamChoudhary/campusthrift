const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initChatSocket = require("./services/chatSocket");
const initCronScheduler = require("./services/cronScheduler");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB().then(() => {
  const io = initChatSocket(server);
  app.set("io", io);
  initCronScheduler();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
