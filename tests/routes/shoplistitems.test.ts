// Vorlage für den Einstieg, vgl. Folie 133

// import "restmatcher";
import dotenv from "dotenv"
dotenv.config()
import supertest from "supertest";
import DB from "../DB";
import { LoginResource, ShopListItemsResource } from "../../src/Resources";
import app from "../../src/app";
import { createShopItem } from "../../src/services/ShopItemService";
import { createShopList } from "../../src/services/ShopListService";
import { createUser } from "../../src/services/UsersService";

let shopListId: string // set in beforeEach
const shopItems: ShopListItemsResource = { shopItems: [] }; // content set in beforeEach
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";
var token: string;

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // create a user which we use later on in all tests
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: false })
    // setup a shopList
    const shopList = await createShopList({ store: "John's shop", public: true, creator: john.id!, done: false })
    shopListId = shopList.id!;
    expect(shopListId).toBeDefined();
    // and some shopItems
    for (let m = 0; m < 5; m++) {
        const shopItem = await createShopItem({ name: `Item ${m}`, quantity: `${m + 1} kg`, creator: john.id!, shopList: shopList.id! })
        shopItems.shopItems.push(shopItem);
    }
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

test("shopitems GET, Positivtest", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${shopListId}/shopitems`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);

    const shopItemsRes = response.body;
    expect(shopItemsRes).toEqual(shopItems);
});

test("shopitems GET, nicht existierende ShopList-ID", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${NON_EXISTING_ID}/shopitems`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
});

test("shopitems GET, nicht existierende ShopList-ID", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${123}/shopitems`).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
});
