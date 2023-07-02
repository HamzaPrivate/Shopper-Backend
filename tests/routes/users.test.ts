import supertest from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, UserResource, UsersResource } from "../../src/Resources";
import DB from "../DB";

let john: UserResource
let jane: UserResource
let bob: UserResource
let usersRes: UsersResource = { users: [] }
var token: string;
beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    jane = await createUser({ name: "Jane", email: "jane@doe.de", password: "123", admin: false })
    bob = await createUser({ name: "Bob", email: "bob@boe.de", password: "123", admin: false })
    usersRes.users.push(john);
    usersRes.users.push(jane);
    usersRes.users.push(bob);
    const request = supertest(app);
    const loginData = { email: "john@doe.de", password: "12Ad!!dasf34"};
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("users GET, Positivetest", async ()=>{
    const request = supertest(app);
    const response = await request.get("/api/users").set("Authorization", `Bearer ${token}`).send(jane);
    expect(response.statusCode).toBe(200);

    const usersResFromResponse = response.body as UsersResource;
    expect(usersRes.users.length).toBe(3);
    expect(usersRes).toEqual(usersResFromResponse);
})

test("users GET, with not existent url", async ()=>{
    const request = supertest(app);
    const response = await request.get("/api/something");
    expect(response.statusCode).toBe(404);
})