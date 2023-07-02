import { HydratedDocument, Types } from "mongoose";
import { createShopItem } from "../../src/services/ShopItemService";
import { IUser, User } from "../../src/model/UserModel";
import { ShopItemResource, ShopListResource, UserResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList, deleteShopList, getShopList } from "../../src/services/ShopListService";
import { getShopListItems } from "../../src/services/ShopListItemsService";
import { createUser, deleteUser } from "../../src/services/UsersService";
import { ShopList } from "../../src/model/ShopListModel";
import { ShopItem } from "../../src/model/ShopItemModel";

var hamza: HydratedDocument<IUser>;
var shopList: ShopListResource;
var shopItem: ShopItemResource;
beforeAll(async () => await DB.connect());
beforeEach(async () => {
    hamza = await User.create({ email: "hamza@example.com", name: "Hamza", password: "123", admin: true });
    var shopListResource: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(shopListResource);

    var shopItemResource: ShopItemResource = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }

    shopItem = await createShopItem(shopItemResource);

});

afterEach(async () => await DB.clear());
afterAll(async () => await DB.close());


test("retrieve items from shopList", async () => {
    var shopItemResource2: ShopItemResource = {
        name: "pullover", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }

    var shopItemResource3: ShopItemResource = {
        name: "socks", quantity: "11", remarks: "dirty",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }
    await createShopItem(shopItemResource2);
    await createShopItem(shopItemResource3);

    const res = await getShopListItems(shopList.id!);
    expect(res).toBeDefined();
    expect(res.shopItems.length).toBe(3);
    expect(res.shopItems[0].name).toBe("shirt");
    expect(res.shopItems[1].name).toBe("pullover");
    expect(res.shopItems[2].name).toBe("socks");
    expect(res.shopItems[0].creator).toBe(hamza.id);
    expect(res.shopItems[1].creator).toBe(hamza.id);
    expect(res.shopItems[2].creator).toBe(hamza.id);
    expect(res.shopItems[0].creatorName).toBe(hamza.name);
    expect(res.shopItems[1].creatorName).toBe(hamza.name);
    expect(res.shopItems[2].creatorName).toBe(hamza.name);
    expect(res.shopItems[0].shopList).toBe(shopList.id);
    expect(res.shopItems[1].shopList).toBe(shopList.id);
    expect(res.shopItems[2].shopList).toBe(shopList.id);
    expect(res.shopItems[0].shopListStore).toBe(shopList.store);
    expect(res.shopItems[1].shopListStore).toBe(shopList.store);
    expect(res.shopItems[2].shopListStore).toBe(shopList.store);

})

//#################### REFERENTIAL INTEGRITY TESTS UPON DELETION ############################################

test("shopList deletion upon user deletion", async () => {
    var hamzasShopListResource2: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(hamzasShopListResource2);
    const sl = await ShopList.find({ creator: hamza.id }).exec();
    expect(sl.length).toBeGreaterThan(0);
    const res = await deleteUser(hamza.id);
    const slAfter = await ShopList.find({ creator: hamza.id }).exec();
    expect(slAfter.length).not.toBeGreaterThan(0);
})

test("shopList deletion upon user deletion", async () => {
    const tomRes: UserResource = {
        name: "Tom", email: "tom@example.com", admin: false, password: "123456"
    }
    const tom = await createUser(tomRes);
    expect(tom).toBeDefined()
    var tomsShopListRes: ShopListResource = {
        store: "bauhaus", public: false, done: false,
        creator: tom.id!, creatorName: tom.name, createdAt: "27-5-00", shopItemCount: 0
    };
    await createShopList(tomsShopListRes);
    const tomsShopLists = await ShopList.find({ creator: tom.id }).exec();
    expect(tomsShopLists.length).toBeGreaterThan(0);
    await deleteUser(tom.id!);
    const tomsShopListsAfter = await ShopList.find({ creator: tom.id }).exec();
    expect(tomsShopListsAfter.length).toBe(0)

})

test("shopitem deletion upon shoplist deletion",async () => {
    var shopItemResource2: ShopItemResource = {
        name: "pullover", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }

    var shopItemResource3: ShopItemResource = {
        name: "socks", quantity: "11", remarks: "dirty",
        creator: hamza.id, creatorName: hamza.name,
        shopList: shopList.id!, shopListStore: shopList.store
    }
    await createShopItem(shopItemResource2);
    await createShopItem(shopItemResource3);
    let sl = await ShopList.find({ creator: hamza.id }).exec()
    let items = await ShopItem.find({ creator: hamza.id }).exec()
    expect(sl.length).toBe(1)
    expect(items.length).toBe(3)
    await deleteShopList(shopList.id!);
    let slAfter = await ShopList.find({ creator: hamza.id }).exec()
    let itemsAfter = await ShopItem.find({ creator: hamza.id }).exec()
    expect(slAfter.length).toBe(0)
    expect(itemsAfter.length).toBe(0)
})

test("wrong id throws error", async () => {
    await expect(() => getShopListItems(new Types.ObjectId(32141).toString())).rejects.toThrow();

})

test("error upon falsy arg", async () => {
    await expect(getShopListItems(undefined!)).rejects.toThrow();
})

