require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/pool");

pool
  .connect({
    host: "localhost",
    port: 5432,
    database: "socialnetwork2",
    user: "postgres",
    password: process.env.DATABASE_PASSWORD,
  })
  .then(() => {
    app().listen(3005, () => {
      console.log("listening on port 3005");
    });
  })
  .catch((err) => console.error(err));
