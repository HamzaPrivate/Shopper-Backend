import { HydratedDocument, Types } from "mongoose";
import { createShopItem, deleteShopItem, getShopItem, updateShopItem } from "../../src/services/ShopItemService";
import { IUser, User } from "../../src/model/UserModel";
import { ShopItemResource, ShopListResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList, getShopList } from "../../src/services/ShopListService";
import { ShopItem } from "../../src/model/ShopItemModel";

var hamza: HydratedDocument<IUser>;
var shopList: ShopListResource;
var shopItemResource: ShopItemResource;
beforeAll(async () => await DB.connect());
beforeEach(async () => {
    hamza = await User.create({ email: "hamza@example.com", name: "Hamza", password: "123", admin: true });
    var shopListResource: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(shopListResource);

    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }

});

afterEach(async () => await DB.clear());
afterAll(async () => await DB.close());


test("createShopItem", async () => {
    const si = await createShopItem(shopItemResource);
    expect(si).not.toBe(undefined);
    expect(si.creator).toBe(hamza.id);
    expect(si.creatorName).toBe(hamza.name);
    expect(si.createdAt).toBeDefined();
    expect(si.name).toBe("shirt");
    expect(si.quantity).toBe("2");
    expect(si.remarks).toBe("clean");
    expect(si.shopList).toBe(shopList.id);
    expect(si.shopListStore).toBe("hm");

})

test("createShopItem but shoplist is done", async () => {
    var doneSl: ShopListResource = {
        store: "kik", public: true, done: true,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(doneSl);

    shopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }

    await expect(() => createShopItem(shopItemResource)).rejects.toThrow("ShopList is closed. Therfore no new item can be inserted");

})

test("createShopIten error due to done shopList", async () => {
    var slr: ShopListResource = {
        store: "hma", public: true, done: true,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    slr = await createShopList(slr);
    var sir = {
        name: "shirta", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: slr.id!, shopListStore: slr.store
    }
    await expect(() => createShopItem(sir)).rejects.toThrow("ShopList is closed. Therfore no new item can be inserted.");
})

test("createShopItem error due to invalid creatorid", async () => {
    var sir = {
        name: "shirta", quantity: "2", remarks: "clean",
        creator: new Types.ObjectId(1234).toString(), creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }
    await expect(() => createShopItem(sir)).rejects.toThrow("CreatorID is invalid, cannot create shopitem.");
})

test("createShopItem error due to invalid shoplistid", async () => {
    var sir = {
        name: "shirta", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: new Types.ObjectId(1234).toString(), shopListStore: shopList.store
    }
    await expect(() => createShopItem(sir)).rejects.toThrow("ShopListID is invalid, cannot create shopitem.");
})

test("getShopList error", async () => {
    await expect(() => getShopItem(undefined!)).rejects.toThrow();
    const si = await createShopItem(shopItemResource);
    await expect(() => getShopItem(new Types.ObjectId(432432).toString())).rejects.toThrow();
})

test("getShopItem", async () => {
    const si = await createShopItem(shopItemResource);
    const res = await getShopItem(si.id!);
    expect(res).toBeDefined();
    expect(res.id).toBe(si.id);
    expect(res).toStrictEqual(si);
})

test("updateShopItem", async () => {
    const si = await createShopItem(shopItemResource);
    expect(si.creator).toBe(hamza.id)
    si.name = "updated"
    si.quantity = "3"
    si.remarks = "updated remark"
    si.creator = "fdsa";
    const res = await updateShopItem(si);
    expect(res).not.toStrictEqual(si);
    expect(res.name).toBe("updated")
    expect(res.quantity).toBe("3")
    expect(res.remarks).toBe("updated remark")
    expect(res.creator).not.toBe(undefined)
})

test("updateShopItem error", async () => {
    const si = await createShopItem(shopItemResource);
    si.id = undefined!;
    await expect(() => updateShopItem(si)).rejects.toThrow("ShopItem id missing, cannot update");
    const wrongId = new Types.ObjectId(22222).toString();
    si.id = wrongId;
    await expect(() => updateShopItem(si)).rejects.toThrow(`No ShopItem with id ${si.id} found, cannot update`);

})


test("deleteShopItem", async () => {
    const si = await createShopItem(shopItemResource);
    await deleteShopItem(si.id!);
    let res = await ShopItem.findById(si.id).exec();
    expect(res).toBeFalsy();
})

test("deleteShopItem error", async () => {
    const si = await createShopItem(shopItemResource);
    await expect(() => deleteShopItem(undefined!)).rejects.toThrow("No id given, cannot delete ShopItem.");
    const wrongId = new Types.ObjectId(22222).toString();
    await expect(() => deleteShopItem(wrongId)).rejects.toThrow(`No ShopItem with id ${wrongId} deleted, probably id not valid`);
})


