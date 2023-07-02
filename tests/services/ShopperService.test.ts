import { HydratedDocument, Types } from "mongoose";
import { createShopItem, deleteShopItem} from "../../src/services/ShopItemService";
import { IUser, User } from "../../src/model/UserModel";
import { ShopItemResource, ShopListResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList, deleteShopList } from "../../src/services/ShopListService";
import { getShopListItems } from "../../src/services/ShopListItemsService";
import { getShopper } from "../../src/services/ShopperService";
import exp from "constants";

var hamza: HydratedDocument<IUser>;
var shopList: ShopListResource;
var shopItemResource: ShopItemResource;
var shopItem: ShopItemResource; 
beforeAll(async () => await DB.connect());
beforeEach(async () => {
    hamza = await User.create({ email: "hamza@example.com", name: "Hamza", password: "123", admin: true });
    var shopListResource: ShopListResource = {
        store: "hm", public: true, done: false,
        creator: hamza.id, creatorName: hamza.name, shopItemCount: 0
    };
    shopList = await createShopList(shopListResource);

    shopItemResource  = {
        name: "shirt", quantity: "2", remarks: "clean",
        creator: hamza.id, creatorName: hamza.name, 
        shopList: shopList.id!, shopListStore: shopList.store
    }

    shopItem = await createShopItem(shopItemResource);

});

afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("return all ShopLists where public true or own userid",async () => {
    await createShopItem(shopItemResource);
    await createShopItem(shopItemResource);
    await createShopItem(shopItemResource);
    const res = await getShopper(hamza.id);
    expect(res).toBeDefined();
    expect(res.shopLists.length).toBe(1);
})

test("shopper works even if no items", async () => {
    await deleteShopList(shopList.id!);
    const res = await getShopper(hamza.id);
    expect(res).toBeDefined();
    expect(res.shopLists.length).toBe(0)
})

test("shopper doesnt contain private shoplist (andoes not belong to the user)", async () => {
    await deleteShopList(shopList.id!);
    let someOtherUser = await User.create({ email: "xyz@example.com", name: "yo", password: "123", admin: false });
    var shopListResource2: ShopListResource = {
        store: "hm2", public: false, done: false,
        creator: someOtherUser.id, creatorName: someOtherUser.name, shopItemCount: 0
    };
    shopList = await createShopList(shopListResource2);
    const res = await getShopper(hamza.id);
    expect(res).toBeDefined();
    expect(res.shopLists.length).toBe(0)
})



