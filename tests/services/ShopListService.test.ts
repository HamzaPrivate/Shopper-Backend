import { HydratedDocument, Types } from "mongoose";
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IUser, User } from "../../src/model/UserModel";
import { createShopList, deleteShopList, getShopList, updateShopList } from "../../src/services/ShopListService";
import { ShopListResource } from "../../src/Resources";
import { logger } from "../../src/logger";

var saturn: HydratedDocument<IShopList>; 
var hamza: HydratedDocument<IUser>; 
var shopListResource: ShopListResource
beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
    hamza = await User.create({ email: "hamza@example.com", name: "Hamza", password: "123", admin: true }); 
    saturn = await ShopList.create({
        store: "saturn",
        public: true,
        done: true,
        creator: hamza
    })
    shopListResource = {store: "hm", public: true, done: false,
                        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0}
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("getShopList Error", async ()=>{
    await expect(()=> getShopList("")).rejects.toThrow();
})

test("createShopList", async ()=>{
    let res = await createShopList(shopListResource)
    res.id = "123"
    let exp = {id: "123", store: "hm", public: true, done: false, createdAt: res.createdAt,
         creator: hamza.id, creatorName: hamza.name, shopItemCount: 0};
    expect(res).toStrictEqual(exp);
    
})

test("createShopList throw error on invalid creator", async ()=>{
    shopListResource.creator = undefined!;
    await expect(()=> createShopList(shopListResource)).rejects.toThrow("Creator is invalid. Cannot create Shoplist.");
})

test("getShopList", async ()=>{
    let res = await createShopList(shopListResource)
    const res2 = await getShopList(res.id!);
    expect(res2.creator).toBe(hamza.id);
    expect(res2.shopItemCount).toBe(0);
    expect(res2.creatorName).toBe("Hamza")
})

test("updateShopList error", async ()=>{
    shopListResource = {store: "hm", public: true, done: false,
                        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0}
    let res = await createShopList(shopListResource);
    res.id = undefined;
    await expect(updateShopList(res)).rejects.toThrow("ShopList id missing, cannot update");
    res.id = new Types.ObjectId(32).toString();
    await expect(updateShopList(res)).rejects.toThrow(`No ShopList with id ${res.id} found, cannot update`);

})

test("updateShopList", async ()=>{
    shopListResource = {store: "hm", public: true, done: false,
                        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0}
    let res = await createShopList(shopListResource);
    res.done = true;
    res.store = "bla";
    res.public = false;
    expect((await updateShopList(res)).store).toBe("bla");
    expect((await updateShopList(res)).done).toBe(true);
    expect((await updateShopList(res)).public).toBe(false);
})

test("deleteShopList", async ()=>{
    shopListResource = {store: "hm", public: true, done: false,
                        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0}
    let res = await createShopList(shopListResource);
    let res2 = await ShopList.findById(res.id).exec();
    expect(res2).toBeTruthy();
    await deleteShopList(res.id!);
    let res3 = await ShopList.findById(res.id).exec();
    expect(res3).toBeFalsy();
})

test("deleteShopList error", async ()=>{
    shopListResource = {store: "hm", public: true, done: false,
                        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0}
    let res = await createShopList(shopListResource);
    await expect(deleteShopList(undefined!)).rejects.toThrow();
    await expect(deleteShopList(new Types.ObjectId(234).toString())).rejects.toThrow();
})
