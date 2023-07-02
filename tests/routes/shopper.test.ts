import dotenv from "dotenv"
dotenv.config()
import supertest from "supertest";
import app from "../../src/app";
import { createShopList} from "../../src/services/ShopListService";
import { LoginResource, ShopperResource } from "../../src/Resources";
import DB from "../DB";
import { UserResource } from "../../src/Resources";
import { createUser } from "../../src/services/UsersService";
import { login } from "../../src/services/AuthenticationService";
import exp from "constants";

const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

const shopper: ShopperResource = {shopLists: []};
var hamza: UserResource;
var token: string;
beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    hamza = await createUser({name: "Hamza", email: "hamza@example.com", password: "12Ad!!dasf34", admin: false})
    expect(hamza).toBeDefined()
    for (let i = 0; i < 3; i++) {
        const sl = await createShopList({
            store: "saturn" + i,
            public: false,
            done: true,
            creator: hamza.id!,
            creatorName: hamza.name,
            shopItemCount: 0
        })
        shopper.shopLists.push(sl);
    }
    const request = supertest(app);
    const loginData = { email: "hamza@example.com", password: "12Ad!!dasf34"};
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("shopper get, positive",async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shopper`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);//returned 404 here
    const insides = response.body as ShopperResource;
    expect([...insides.shopLists]).toEqual([...shopper.shopLists]);
})


