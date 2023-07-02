import { ShopListItemsResource, ShopItemResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { IShopList, ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Gibt alle ShopItems einer ShopList zurück.
 */
export async function getShopListItems(shopListId: string): Promise<ShopListItemsResource> {
  if (!shopListId) throw new Error("ShopList id is invalid.")
  const slExists = await ShopList.findById(shopListId);
  if(!slExists) throw new Error(`No shoplist found under the id: ${shopListId}`);
  const items = await ShopItem.find({ shopList: shopListId })
    .populate<{ creator: IUser & { id: string }, shopList: IShopList & { id: string } }>([
      { path: "creator" },
      { path: "shopList" } //testen
    ]).exec();
  const shopListItemsResource: ShopListItemsResource = {
    shopItems: items.map(item => ({
      id: item.id, name: item.name, quantity: item.quantity, remarks: item.remarks,
      creator: item.creator.id, creatorName: item.creator.name, createdAt: dateToString(item.createdAt!),
      shopList: item.shopList.id, shopListStore: item.shopList.store
    }))
  };

  return shopListItemsResource;
}
