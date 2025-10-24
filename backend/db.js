/*專門處理 PostgreSQL 連線（透過環境變數 DATABASE_URL）*/
import pkg from "pg";
const { Pool } = pkg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
