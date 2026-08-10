const parsePort = (value) => {
  const port = Number.parseInt(value ?? "4000", 10);
  return Number.isInteger(port) && port > 0 ? port : 4000;
};

export const getConfig = (env = process.env) => ({
  port: parsePort(env.PORT),
  mongoUri: env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
  databaseName: env.MONGODB_DATABASE ?? "nexusflow",
});

