// lib/config.ts
import sql from "mssql";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// HAPUS validasi yang throw error - biarkan dengan default values
const config = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "localhost",
  port: 1433,
  database: process.env.DB_DATABASE ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 60000,
    requestTimeout: 120000,
    cancelTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const login = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "localhost",
  port: 1433,
  database: process.env.DB_DATABASE2 ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 60000,
    requestTimeout: 120000,
    cancelTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | undefined;
let loginPoolPromise: Promise<sql.ConnectionPool> | undefined;

export const getPool = async () => {
  // Jika tidak ada konfigurasi, return error yang graceful
  if (!config.user || !config.password || !config.database) {
    throw new Error("Database configuration incomplete");
  }

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        logger.info("Connected to MSSQL Database: " + config.database);
        return pool;
      })
      .catch((err) => {
        logger.error("Database connection failed: ", err);
        poolPromise = undefined;
        throw err;
      });
  }
  return poolPromise;
};

export const getPoolLogin = async () => {
  // Jika tidak ada konfigurasi, return error yang graceful
  if (!login.user || !login.password || !login.database) {
    throw new Error("Login database configuration incomplete");
  }

  if (!loginPoolPromise) {
    loginPoolPromise = new sql.ConnectionPool(login)
      .connect()
      .then((pool) => {
        logger.info("Connected to MSSQL Login Database: " + login.database);
        return pool;
      })
      .catch((err) => {
        logger.error("Login database connection failed: ", err);
        loginPoolPromise = undefined;
        throw err;
      });
  }
  return loginPoolPromise;
};

// Fungsi untuk menutup koneksi
export const closePools = async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = undefined;
    logger.info("Main database pool closed");
  }
  if (loginPoolPromise) {
    const pool = await loginPoolPromise;
    await pool.close();
    loginPoolPromise = undefined;
    logger.info("Login database pool closed");
  }
};
