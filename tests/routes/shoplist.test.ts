import dotenv from "dotenv"
dotenv.config()
import supertest from "supertest";
import app from "../../src/app";
import { LoginResource, ShopListResource } from "../../src/Resources";
import DB from "../DB";
import { UserResource } from "../../src/Resources";
import { createUser } from "../../src/services/UsersService";
import { Types } from "mongoose";
import { createShopList } from "../../src/services/ShopListService";

const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

var hamza: UserResource;
var shopListResource: ShopListResource;
var token: string;
beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    hamza = await createUser({name: "Hamza", email: "hamza@example.com", password: "12Ad!!dasf34", admin: false})
    shopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
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

test("shoplist post, positive",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
        store: shopListResource.store,
        public: shopListResource.public,
        done: shopListResource.done,
        creator: shopListResource.creator,
        creatorName: shopListResource.creatorName,
        shopItemCount: shopListResource.shopItemCount
      });
      
})

test("shoplist post, positive, no 'done' input okay coz optional",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: "hm", public: true,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    expect(response.statusCode).toBe(201);
})

test("shoplist post, negative, kein gültiger creator",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: "ikea", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    expect(response.statusCode).toBe(201);

    var other: ShopListResource = {
        store: "ikea", public: true, done: false,
        creator: new Types.ObjectId(123).toString(), creatorName: hamza.name, shopItemCount: 0
    };    
    const otherResponse = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(other);
    expect(otherResponse.statusCode).toBe(400);
})

test("shoplist post, negative",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: undefined!, public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    expect(response.statusCode).toBe(400);
})

test("shoplist post, negative, 401",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: "dsa", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${undefined}`).send(shopListResource);
    expect(response.statusCode).toBe(401);
})


test("shoplist post, negative, ",async () => {
    const request = supertest(app);
    var shopListResource: ShopListResource = {
        store: undefined!, public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    expect(response.statusCode).toBe(400);
})

test("shoplist get, positive",async () => {
    const request = supertest(app);
    const response = await request.post("/api/shoplist").set("Authorization", `Bearer ${token}`).send(shopListResource);
    const sl = response.body;
    const responseOfGet = await request.get(`/api/shoplist/${sl.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseOfGet.statusCode).toBe(200);
})

test("shoplist get, negative",async () => {
    const request = supertest(app);
    const responseOfGet = await request.get(`/api/shoplist/${NON_EXISTING_ID}`).set("Authorization", `Bearer ${token}`)
    expect(responseOfGet.statusCode).toBe(404);
})

test("shoplist get, negative, invalidmongoid",async () => {
    const request = supertest(app);
    const responseOfGet = await request.get(`/api/shoplist/${123}`).set("Authorization", `Bearer ${token}`)
    expect(responseOfGet.statusCode).toBe(400);
})

test("shopList put, positive",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        id: sl.id, store: "updatedNameOnly", public: true, done: false, createdAt: sl.createdAt,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(200)
})

test("shopList put, negative",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        id: undefined, store: "ds", public: true, done: false, createdAt: sl.createdAt,
        creator: hamza.id!, creatorName: "af", shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(400)
})


test("shopList put, negative",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        id: undefined, store: "ds", public: true, done: false, createdAt: sl.createdAt,
        creator: hamza.id!, creatorName: "af", shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(400)
})

test("shopList put, negative",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    shopListResource = {
        store: "xy", public: true, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    var updated: ShopListResource = {
        id: createdSl.id, store: "xy", public: true, done: false, createdAt: createdSl.createdAt,
        creator:john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${createdSl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(403)
})

test("shopList put, postive, new creator on update does not apply",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        id: sl.id, store: "hm", public: true, done: false, createdAt: sl.createdAt,
        creator: NON_EXISTING_ID, creatorName: hamza.name, shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.body.creator).toBe(sl.creator);
    expect(responsePut.statusCode).toBe(200)
})


test("shopList put, negative, creatorid is not mongoid",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        id: new Types.ObjectId(1234).toString() ,store: "ds", public: true, done: false, createdAt: sl.createdAt,
        creator: hamza.id!, creatorName: "af", shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(400)
})

test("shopList put, negative, creatorid is mongo but wrong",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        store: "ds", public: true, done: false, createdAt: sl.createdAt,
        creator: new Types.ObjectId(123).toString(), creatorName: "af", shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(400)
})

//todo
test("shopList put, negative, creatorid is mongo but wrong",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    expect(sl.id).toBeDefined();
    var updated: ShopListResource = {
        store: "ds", public: true, done: false, createdAt: sl.createdAt,
        creator: new Types.ObjectId(123).toString(), creatorName: "af", shopItemCount: 0
    };    
    const responsePut = await request.put(`/api/shoplist/${sl.id}`).send(updated).set("Authorization", `Bearer ${token}`);
    expect(responsePut.statusCode).toBe(400)
})

test("shoplist delete, positive",async () => {
    const request = supertest(app);  
    const responsePost = await request.post("/api/shoplist").send(shopListResource).set("Authorization", `Bearer ${token}`);
    const sl = responsePost.body;
    const responseDelete = await request.delete(`/api/shoplist/${sl.id}`).set("Authorization", `Bearer ${token}`);
    expect(responseDelete.statusCode).toBe(204)
})

test("shoplist delete, negative",async () => {
    const request = supertest(app);  
    const responseDelete = await request.delete(`/api/shoplist/${NON_EXISTING_ID}`).set("Authorization", `Bearer ${token}`);
    expect(responseDelete.statusCode).toBe(404)
})

test("shoplist delete, negative, can only be deleted by creator",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    shopListResource = {
        store: "xy", public: true, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    const responseDelete = await request.delete(`/api/shoplist/${createdSl.id}`).set("Authorization", `Bearer ${token}`);
    expect(responseDelete.statusCode).toBe(403)
})

test("shoplist delete, negative",async () => {
    const request = supertest(app);  
    const responseDelete = await request.delete(`/api/shoplist/${123}`).set("Authorization", `Bearer ${token}`);
    expect(responseDelete.statusCode).toBe(400)
})

