import dotenv from "dotenv"
dotenv.config()
import supertest from "supertest";
import { LoginResource, ShopItemResource, ShopListResource, UserResource } from "../../src/Resources";
import { createUser } from "../../src/services/UsersService";
import DB from "../DB"
import app from "../../src/app";
import { createShopList } from "../../src/services/ShopListService";
import { ShopList } from "../../src/model/ShopListModel";
import { createShopItem } from "../../src/services/ShopItemService";

var hamza: UserResource;
var shopList: ShopListResource;
var shopItemResource: ShopItemResource;
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";
var token: string;
beforeAll(async () => { 
    await DB.connect()  
})
beforeEach(async () => {
    hamza = await createUser({name: "Hamza", email: "hamza@example.com", password: "12Ad!!dasf34", admin: false})
    var shopListResource: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(shopListResource);

    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }    
    const request = supertest(app);
    const loginData = { email: "hamza@example.com", password: "12Ad!!dasf34"};
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear()})
afterAll(async () => {await DB.close()})

test("shopitem POST, positive",async ()=>{
    const request = supertest(app);
    const response = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);
    const si = response.body;
    expect(si).toMatchObject({
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    });
    
})

test("shopItem get, negative, 403 shoplist of shopitem private and wants to be seen by user other than creator",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    var shopListResource = {
        store: "xy", public: false, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: john.id!, creatorName: john.name,
        shopList: createdSl.id!, shopListStore: createdSl.store
    }    
    const createdSi = await createShopItem(shopItemResource);
    const responseGet = await request.get(`/api/shopitem/${createdSi.id}`).set("Authorization", `Bearer ${token}`);
    expect(responseGet.statusCode).toBe(403)
})
//
test("shopitem POST, negative, nonexisting shoplist id",async ()=>{
    const request = supertest(app)
    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    };
    const response = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);//??
})

test("shopItem post, negative, 403 shoplist private and logged user isnt shoplist creator",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    var shopListResource = {
        store: "xy", public: false, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: john.id!, creatorName: john.name,
        shopList: createdSl.id!, shopListStore: createdSl.store
    }    
    const responseGet = await request.post(`/api/shopitem`).set("Authorization", `Bearer ${token}`).send(shopItemResource);
    expect(responseGet.statusCode).toBe(403)
})

test("shopitem POST, negative, shoplist is done, cannot add item",async ()=>{
    const request = supertest(app)
    var testSL: ShopListResource = {
        store: "test", public: true, done: false,//auf true setzen
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };
    const doneSL = await createShopList(testSL);
    const si = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,    //non existing ids nutzen
        shopList: doneSL.id!, shopListStore: doneSL.store
    };
    const response = await request.post("/api/shopitem").send(si).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);//??      //FEHLERMELDUNGEN ANALYSIEREN UND MANUELL SETZEN, wichtig für UI damit das falsche feld angezeigt wird
})

test("shopitem put, negative, shoplist is done, cannot add item",async ()=>{
    const request = supertest(app)
    var testSL: ShopListResource = {
        store: "test", public: true, done: false,
        creator: hamza.id!, creatorName: hamza.name, shopItemCount: 0
    };
    const doneSL = await createShopList(testSL);
    const si = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: doneSL.id!, shopListStore: doneSL.store
    };
    const response = await request.post("/api/shopitem").send(si).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);//??
})
//

test("shopitem POST, negative",async ()=>{
    const request = supertest(app);
    shopItemResource = undefined!
    const response = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
})

test("shopitem GET, positive",async ()=>{
    const request = supertest(app);
    const createdShopItem = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    const responseGet = await request.get(`/api/shopitem/${createdShopItem.body.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseGet.statusCode).toBe(200)
    expect(responseGet.body).toMatchObject({
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    });
})

test("shopitem GET, negative",async ()=>{
    const request = supertest(app);
    const responseGet = await request.get(`/api/shopitem/${NON_EXISTING_ID}`).set("Authorization", `Bearer ${token}`)
    expect(responseGet.statusCode).toBe(404)
})

test("shopitem GET, negative",async ()=>{
    const request = supertest(app);
    const responseGet = await request.get(`/api/shopitem/${123}`).set("Authorization", `Bearer ${token}`)
    expect(responseGet.statusCode).toBe(400)
})

test("shopitem PUT, positive",async ()=>{
    const request = supertest(app);
    const createdShopItem = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    expect(createdShopItem.statusCode).toBe(201)
    createdShopItem.body.name = "someupdate";
    const updatedShopItem = await request.put(`/api/shopitem/${createdShopItem.body.id}`).send(createdShopItem.body).set("Authorization", `Bearer ${token}`)
    expect(updatedShopItem.statusCode).toBe(200)

    const responseGet = await request.get(`/api/shopitem/${updatedShopItem.body.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseGet.statusCode).toBe(200)
    expect(responseGet.body).toMatchObject({
        name: "someupdate", quantity: "2", remarks: "clean",
        creator: hamza.id!, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    });
})

test("shopitem PUT, negative",async ()=>{
    const request = supertest(app);
    const createdShopItem =await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    createdShopItem.body.name = "fdsa"!;
    const updatedShopItem = await request.put(`/api/shopitem/${NON_EXISTING_ID}`).send(createdShopItem.body).set("Authorization", `Bearer ${token}`)
    expect(updatedShopItem.statusCode).toBe(400)
})

test("shopitem PUT, negative, id does not match",async ()=>{
    const request = supertest(app);
    const createdShopItem = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    var updated: ShopItemResource = {
            id: undefined!, name: "shirt", quantity: "2", remarks: "clean",
            creator: hamza.id!, creatorName: hamza.name,
            shopList: shopList.id!, shopListStore: shopList.store
        }  
    const updatedShopItem = await request.put(`/api/shopitem/${createdShopItem.body.id}`).send(updated).set("Authorization", `Bearer ${token}`)
    expect(updatedShopItem.statusCode).toBe(400)
})

test("shopItem put, negative, 403 logged user is neither the shoplist owner nor the shopitem owner",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    var shopListResource = {
        store: "xy", public: false, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: john.id!, creatorName: john.name,
        shopList: createdSl.id!, shopListStore: createdSl.store
    }    
    const createdSi = await createShopItem(shopItemResource);
    createdSi.name = "someupdate";
    const responsePut = await request.put(`/api/shopitem/${createdSi.id}`).set("Authorization", `Bearer ${token}`).send(createdSi)
    expect(responsePut.statusCode).toBe(403)
})


test("shopitem DELETE, positive",async ()=>{
    const request = supertest(app);
    const createdShopItem = await request.post("/api/shopitem").send(shopItemResource).set("Authorization", `Bearer ${token}`);
    const responseGetBeforeDelete = await request.get(`/api/shopitem/${createdShopItem.body.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseGetBeforeDelete.statusCode).toBe(200);
    await request.delete(`/api/shopitem/${createdShopItem.body.id}`).set("Authorization", `Bearer ${token}`); 
    const responseGet = await request.get(`/api/shopitem/${createdShopItem.body.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseGet.statusCode).toBe(404);
})

test("shopitem DELETE, negative",async ()=>{
    const request = supertest(app);
    let res = await request.delete(`/api/shopitem/${NON_EXISTING_ID}`).set("Authorization", `Bearer ${token}`); 
    expect(res.statusCode).toBe(404);
})

test("shopItem delete, negative, 403 logged user is neither the shoplist owner nor the shopitem owner",async () => {
    const request = supertest(app);     
    const john = await createUser({ name: "John", email: "john@doe.de", password: "12Ad!!dasf34", admin: true })
    var shopListResource = {
        store: "xy", public: false, done: false,
        creator: john.id!, creatorName: john.name, shopItemCount: 0
    };    
    const createdSl = await createShopList(shopListResource);
    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: john.id!, creatorName: john.name,
        shopList: createdSl.id!, shopListStore: createdSl.store
    }    
    const createdSi = await createShopItem(shopItemResource);
    const responseDelete = await request.delete(`/api/shopitem/${createdSi.id}`).set("Authorization", `Bearer ${token}`)
    expect(responseDelete.statusCode).toBe(403)
})


test("shopitem DELETE, negative",async ()=>{
    const request = supertest(app);
    let res = await request.delete(`/api/shopitem/${123}`).set("Authorization", `Bearer ${token}`); 
    expect(res.statusCode).toBe(400);
})