import { HydratedDocument } from "mongoose";
import DB from "../DB";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { IUser, User } from "../../src/model/UserModel";
import { IShopList, ShopList } from "../../src/model/ShopListModel";

var handy: HydratedDocument<IShopItem>; 
var hamza: HydratedDocument<IUser>; 
var saturn: HydratedDocument<IShopList>; 
beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
    hamza = await User.create({
            name: "Hamza",
            email: "hamza@example.com",
            password: "123",
            admin: false
    });
    saturn = await ShopList.create({
        store: "saturn",
        public: true,
        done: true,
        creator: hamza
    })
     handy = await ShopItem.create({
        name: "iPhone 10",
        quantity: "1",
        remarks: "some comment",
        shopList: saturn,
        creator: hamza
    });
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("addItem", async () => {
    const item = await ShopItem.create({ name: "x", quantity: 2, creator: hamza, shopList: saturn }) 
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.name).toBe("x");
    expect(item.createdAt).toBeDefined();
})

test("addList error", async () => {
    let x = new ShopItem({ name: "x", quantity: 2,creator: hamza, shopList: null  }) 
    await expect(()=>{
         return x.save()
    }).rejects.toThrowError();
});

test("deleteUser", async () => {
    await handy.deleteOne();
    let res = await ShopItem.find({name: "iPhone 10"}).exec();
    expect(res[0]).toEqual(undefined);
})

test("update", async () => {
    await ShopItem.updateOne({quantity: 1}, {name: "changed"}).exec();
    let res = await ShopItem.find({name: "changed"}).exec();
    expect(res[0]).toBeDefined();
    expect(res[0].name).toBe("changed");
})

test("user exists", async ()=>{
    let shopItem = await ShopItem.find({name: "iPhone 10"}).exec();
    expect(shopItem.length).toBe(1);
    expect(shopItem[0].name).toBe("iPhone 10");
    expect(shopItem[0].quantity).toBe("1");
    expect(shopItem[0].remarks).toBe("some comment");
});

test("sth", async ()=>{
    let shopItem = await ShopItem.find({name: "iPhone 10"}).exec();
    expect(shopItem[0].id).toBeDefined();
})

test("Create and retrieve Entry", async () => {

    const entryFound = await ShopItem.findOne({ name: "iPhone 10" }).exec();
    if (!entryFound) {
        throw new Error("Did not find previously created entry.")
    }
    expect(entryFound.remarks).toBe("some comment");
    expect(entryFound.shopList._id.valueOf()).toEqual(saturn.id.valueOf());
})


test("Create and retrieve Entries of a List", async () => {

    const entries = await ShopItem.find({ shopList: saturn._id }).exec();
    expect(entries.length).toBe(1);
})