require("dotenv").config({ path: "./jest.env" });
const request = require("supertest");
const buildApp = require("../../../app");
const UserRepo = require("../../../repos/user_repo");
const Context = require("../../context");

let context;
beforeAll(async () => {
  context = await Context.build();
});

afterAll(async () => {
  return await context.close();
});

afterEach(async () => {
  await context.reset();
});

it("creates a user", async () => {
  const startingCount = await UserRepo.count();

  await request(buildApp())
    .post("/users")
    .send({ username: "testuser", bio: "test bio" })
    .expect(200);

  const finishCount = await UserRepo.count();
  expect(finishCount - startingCount).toEqual(1);
});
