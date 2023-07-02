import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { LoginResource } from "../../src/Resources";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import DB from "../DB";

let strongPW = "123asdf!ABCD"

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    User.syncIndexes();
    await createUser({ name: "John", email: "john@some-host.de", password: strongPW, admin: false })
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("login POST", async () => {
    const request = supertest(app);
    const loginData = { email: "john@some-host.de", password: strongPW};
    const response = await request.post(`/api/login`).send(loginData);
    expect(response).toBeDefined();
    const loginResource = response.body as LoginResource;
    expect(loginResource).toBeDefined();
    const token = loginResource.access_token;
    expect(token).toBeDefined();
});

test("login negative", async () => {
    const request = supertest(app);
    const loginData = { email: "johnome-host.de", password: strongPW};
    const response = await request.post(`/api/login`).send(loginData);
    expect(response.statusCode).toBe(400);
});

test("login negative, incorrect pw", async () => {
    const request = supertest(app);
    const loginData = { email: "john@some-host.de", password: strongPW+2};
    const response = await request.post(`/api/login`).send(loginData);
    expect(response.statusCode).toBe(401);
});

