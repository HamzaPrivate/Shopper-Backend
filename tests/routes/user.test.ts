// Vgl. Folie 126 (SuperTest)
import dotenv from "dotenv"
dotenv.config()

import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, UserResource } from "../../src/Resources";
import DB from "../DB";

let john: UserResource
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";
var token: string;
beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
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

test("user POST, Positivtest", async () => {
    const request = supertest(app);
    const jane: UserResource = { name: "Janes", email: "janse@doe.de", password: "Abc123def456^", admin: false };
    expect(token).toBeDefined();
    const responsePost = await request.post(`/api/user`).set("Authorization", `Bearer ${token}`).send(jane);
    const janeModel = await User.findOne({ email: "janse@doe.de" });
    expect(responsePost.statusCode).toBe(201);
    const userRes = responsePost.body as UserResource;
    const { password, ...expected } = { ...jane, id: janeModel!.id };
    expect(userRes).toEqual(expected);
});


test("user PUT, Negativtest, duplicate email", async () => {
    const request = supertest(app);
    const jane: UserResource = { name: "Jane", email: "jane@doe.de", password: "Abc123def456^", admin: false };
    const response = await request.post(`/api/user`).set("Authorization", `Bearer ${token}`).send(jane);
    const responseBody: UserResource = response.body;
    expect(response.statusCode).toBe(201);
    //john already exists
    const duplicateJohn: UserResource = { id: responseBody.id, name: "Josshn", email: "john@doe.de", password: "Abc123def456^", admin: false };
    const updated = await request.put(`/api/user/${responseBody.id}`).set("Authorization", `Bearer ${token}`).send(duplicateJohn);
    expect(updated.statusCode).toBe(400);
});

test("user PUT, Negativtest, duplicate email", async () => {
    const request = supertest(app);
    const jane: UserResource = { name: "Jane", email: "jane@doe.de", password: "Abc123def456^", admin: false };
    const response = await request.post(`/api/user`).send(jane).set("Authorization", `Bearer ${token}`);
    const responseBody: UserResource = response.body;
    expect(response.statusCode).toBe(201);
    //john already exists
    const duplicateJohn: UserResource = { id: responseBody.id, name: "John", email: "johndsad@doe.de", password: "Abc123def456^", admin: false };
    const updated = await request.put(`/api/user/${responseBody.id}`).send(duplicateJohn).set("Authorization", `Bearer ${token}`);
    expect(updated.statusCode).toBe(400);
});


test("user POST, Negative", async () => {
    const request = supertest(app);
    const jane: UserResource = { name: "jane", email: "jane@example.com", password: "Abc123def456^", admin: false };
    const response = await request.post(`/api/user`).send(jane).set("Authorization", `Bearer ${token}`);
    let janeDuplicate: UserResource = {name: "jane", email: "jane@example.com", password: "Abc123def456^", admin: false };
    const responseDup = await request.post(`/api/user`).send(janeDuplicate).set("Authorization", `Bearer ${token}`);
    expect(responseDup.statusCode).toBe(400);
});

test("user POST, positive, no admin input", async () => {
    const request = supertest(app);
    const jane: UserResource = { name: "jane", email: "jane@example.com", password: "Abc123def456^", admin: undefined!};
    const response = await request.post(`/api/user`).send(jane).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);
});

test("user POST, negative, name > 100 chars", async () => {
    let longName = "h";
    for (let i = 0; i < 10; i++) {
        longName += "hamzahamza";
    }
    expect(longName.length).toBe(101);
    const request = supertest(app);
    const jane: UserResource = { name: longName, email: undefined!, password: "Abc123def456^", admin: false };
    const response = await request.post(`/api/user`).send(jane).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});

test("user POST, Negative, mail > 100 chars", async () => {
    let longMail = "";
    for (let i = 0; i < 10; i++) {
        longMail += "hamzahamza";
    }
    longMail+= "@gmail.com"
    expect(longMail.length).toBeGreaterThan(100);
    const request = supertest(app);
    const jane: UserResource = { name: "some", email: longMail, password: "Abc123def456^", admin: false };
    const response = await request.post(`/api/user`).send(jane).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});

test("user PUT, Positivtest", async () => {
    const request = supertest(app);
    const update: UserResource = { id: john.id, name: "Jane", email: "jane@doe.de", admin: false}
    const response = await request.put(`/api/user/${update.id}`).send(update).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    const updateRes = response.body as UserResource;
    expect(updateRes).toEqual({ ...update });
});

test("user PUT, Negative, INVALIDID", async () => {
    const request = supertest(app);
    const update: UserResource = { id: NON_EXISTING_ID, name: "Jane", email: "jane@doe.de", admin: false }
    const response = await request.put(`/api/user/${NON_EXISTING_ID}`).send(update).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});

test("user PUT, Negative, INVALIDID2", async () => {
    const request = supertest(app);
    const updated : UserResource = ({ id: NON_EXISTING_ID,name: "Jon", email: "john@doe.de", password: "123", admin: false })
    const response = await request.put(`/api/user/${john.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});

test("user PUT, Negative, userID!=userResource.id", async () => {
    const request = supertest(app);
    const someOther : UserResource = ({ id: "2134" ,name: "Jon", email: "jon@doe.de", password: "123", admin: false })
    const otherUser = await createUser(someOther);
    const response = await request.put(`/api/user/${john.id}`).send(otherUser).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});


test("user DELETE, negative, admin cant delete himself", async() => {
    const request = supertest(app);
    const response = await request.delete(`/api/user/${john.id}`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(403);
});

test("user DELETE, negative, INVALIDID", async() => {
    const request = supertest(app);
    const response = await request.delete(`/api/user/${NON_EXISTING_ID}`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(403);
});

test("user DELETE, negative, not mongoid", async() => {
    const request = supertest(app);
    const response = await request.delete(`/api/user/${123}`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});
