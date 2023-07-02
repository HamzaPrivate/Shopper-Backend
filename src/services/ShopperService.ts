import { Types } from "mongoose";
import { ShopperResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { IShopList, ShopList } from "../model/ShopListModel";
import { getShopList } from "./ShopListService";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Gibt alle ShopLists zurück, die für einen User sichtbar sind. Dies sind:
 * - alle öffentlichen (public) ShopLists
 * - alle eigenen ShopLists, dies ist natürlich nur möglich, wenn die userId angegeben ist.
 */
export async function getShopper(userId?: string): Promise<ShopperResource> {
    const res = await ShopList.find().or([{ public: true }, { creator: userId }])
        .populate<{ creator: IUser & { id: string } }>("creator").exec();
    const shopLists: ShopperResource = {
        shopLists: await Promise.all(res.map(async sl => ({
            id: sl.id, store: sl.store, public: sl.public, done: sl.done, creator: sl.creator.id,
            creatorName: sl.creator?.name, createdAt: dateToString(sl.createdAt!), shopItemCount: await getShopItemCount(sl.id)
        })))
    }
    return shopLists;
}

async function getShopItemCount(shopListId: string) {
    const shopItemCount = await ShopItem.countDocuments({ shopList: new Types.ObjectId(shopListId) });
    return shopItemCount;
}