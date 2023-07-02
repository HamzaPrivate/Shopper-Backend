import { HydratedDocument } from "mongoose";
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IUser, User } from "../../src/model/UserModel";

var saturn: HydratedDocument<IShopList>; 
var hamza: HydratedDocument<IUser>; 

beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
    hamza = await User.create({ email: "hamza@example.com", name: "Hamza", password: "123", admin: true });
     saturn = await ShopList.create({
        store: "saturn",
        public: true,
        done: true,
        creator: hamza
    })
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("addList", async () => {
    const list = await ShopList.create({ store: "x", public: false, creator: hamza, done: true }) 
    expect(list).toBeDefined();
    expect(list.id).toBeDefined();
    expect(list.store).toBe("x");
    expect(list.createdAt).toBeDefined();
})

test("addList error", async () => {
    let x = new ShopList({ public: false, creator: null, done: true }) 
    await expect(()=>{
         return x.save()
    }).rejects.toThrowError();
});

test("deleteUser", async () => {
    await saturn.deleteOne();
    let res = await User.find({name: "saturn"}).exec();
    expect(res).toEqual([]);
})

test("update", async () => {
    await ShopList.updateOne({public: true}, {public: false}).exec();
    let res = await ShopList.find({store: "saturn"}).exec();
    expect(res[0]).toBeDefined();
    expect(res[0].public).toBe(false);
})

test("user exists", async ()=>{
    let shoplist = await ShopList.find({store: "saturn"}).exec();
    expect(shoplist.length).toBe(1);
    expect(shoplist[0].store).toBe("saturn");
    expect(shoplist[0].public).toBe(true);
    expect(shoplist[0].done).toBe(true);
});

test("isdefined", async ()=>{
    let shoplist = await ShopList.find({store: "saturn"}).exec();
    expect(shoplist[0].id).toBeDefined();
})

test("Create and retrieve MyCollection", async() => {

    // or
    // const myCollectionCreated2: HydratedDocument<IMyCollection> =await MyCollection.create({
    //     owner: john._id, name: "John's Collection", public: true
    // });

    const shoplist: HydratedDocument<IShopList>[] = await ShopList.find({creator: hamza}).exec();
    expect(shoplist.length).toBe(1);
    expect(shoplist[0].store).toBe("saturn");
    expect(shoplist[0].public).toBe(true);

});