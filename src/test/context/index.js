const pool = require("../../pool");
const { randomBytes } = require("crypto");
const { default: migrate } = require("node-pg-migrate");
const format = require("pg-format");

const DEFAULT_OPTS = {
  host: "localhost",
  port: 5432,
  database: "socialnetwork2-test",
  user: "postgres",
  password: process.env.DATABASE_PASSWORD,
};

class Context {
  static async build() {
    // pg rolename needs to start with a letter
    const roleName = "a" + randomBytes(4).toString("hex");

    // connect ot pg
    await pool.connect(DEFAULT_OPTS);
    // create new role
    await pool.query(
      format("CREATE ROLE %I WITH LOGIN PASSWORD %L;", roleName, roleName)
    );
    // create schema sam as role name
    await pool.query(
      format("CREATE SCHEMA %I AUTHORIZATION %I;", roleName, roleName)
    );
    // disconnect from pg
    await pool.close();
    // run migrations in new schema
    await migrate({
      schema: roleName,
      direction: "up",
      log: () => {},
      noLock: true,
      dir: "migrations",
      databaseUrl: {
        host: "localhost",
        port: 5432,
        database: "socialnetwork2-test",
        user: roleName,
        password: roleName,
      },
    });
    // connect to PG as newly created role
    await pool.connect({
      host: "localhost",
      port: 5432,
      database: "socialnetwork2-test",
      user: roleName,
      password: roleName,
    });

    return new Context(roleName);
  }

  constructor(roleName) {
    this.roleName = roleName;
  }

  async close() {
    // disconnect from pg
    await pool.close();
    //reconnect as root user
    await pool.connect(DEFAULT_OPTS);
    // delete the role and schema
    await pool.query(format("DROP SCHEMA %I CASCADE;", this.roleName));
    await pool.query(format("DROP ROLE %I;", this.roleName));
    // disconnect
    await pool.close();
  }

  async reset() {
    return pool.query(`
      DELETE FROM users;
    `);
  }
}

module.exports = Context;
