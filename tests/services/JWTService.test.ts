import dotenv from "dotenv"
dotenv.config()

import supertest from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import DB from "../DB";
import { sign } from "jsonwebtoken";
import { UserResource } from "../../src/Resources";
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";


let john: UserResource;

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "123", admin: false })
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})


test("verifyPasswordAndCreateJWT, negative, wrong email or pw", async () => {
    const res = await verifyPasswordAndCreateJWT("john@ERROR.de", "123")
    expect(res).toBeUndefined()
});

//TODO
//test undefined jwt secret and ttl

test("verifyPasswordAndCreateJWT, positive", async () => {
    const jwtString = await verifyPasswordAndCreateJWT("john@doe.de", "123");
    expect(jwtString).toBeDefined();
});

test("verifyPasswordAndCreateJWT, positive", async () => {
    process.env.JWT_SECRET = "";
    await expect(()=>verifyPasswordAndCreateJWT("john@doe.de", "123")).rejects.toThrow("JWT_SECRET not set");
});

test("verifyJWT, negative, undefined jwtString", async () => {
    expect(()=>verifyJWT(undefined)).toThrow("jwtString invalid");
});

test("verifyJWT, negative, secret not set", async () => {
    process.env.JWT_SECRET="ThisIsMySuperSecretPassPhraseWithSpecial§$%Characters!"
    const jwtString = await verifyPasswordAndCreateJWT("john@doe.de", "123");
    expect(jwtString).toBeDefined();
    process.env.JWT_SECRET = "";
    expect(()=>verifyJWT(jwtString)).toThrow("JWT_SECRET not set");
    process.env.JWT_SECRET="ThisIsMySuperSecretPassPhraseWithSpecial§$%Characters!"
});

test("verifyJWT, negative, undefined jwtString", async () => {
    expect(()=>verifyJWT("fsaf")).toThrow("invalid_token");
});


test("verifyJWT, positive, payload", async () => {
    process.env.JWT_SECRET="ThisIsMySuperSecretPassPhraseWithSpecial§$%Characters!"
    process.env.JWT_TTL = "300";
    const jwtString = await verifyPasswordAndCreateJWT("john@doe.de", "123");
    expect(jwtString).toBeDefined();
    const verifiedUser = verifyJWT(jwtString);
    expect(verifiedUser).toBeDefined()
});