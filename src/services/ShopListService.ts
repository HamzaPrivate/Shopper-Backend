import { Types } from "mongoose";
import { dateToString } from "./ServiceHelper";
import { ShopListResource } from "../Resources";
import { ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { ShopItem } from "../model/ShopItemModel";

/**
 * Liefer die ShopList mit angegebener ID.
 * Falls keine ShopList gefunden wurde, wird ein Fehler geworfen.
 */
export async function getShopList(id: string): Promise<ShopListResource> {
    const sl = await ShopList.findById(id).populate<{creator: IUser&{id: string}}>("creator").exec();
    if(!sl) throw new Error(`Keine Shoplist gefunden unter der ID: ${id}`);
    const creator = await User.findOne({_id: new Types.ObjectId(sl.creator.id)}).exec();
    const shopItemCount = await ShopItem.countDocuments({shopList: new Types.ObjectId(sl.id)});
    const shopListResource: ShopListResource = 
      {id: sl.id, store: sl.store, public: sl.public, done: sl.done, creator: sl.creator.id,
        creatorName: creator?.name, createdAt: dateToString(sl.createdAt!), shopItemCount: shopItemCount}
    return shopListResource;
}

/**
 * Erzeugt die ShopList.
 */
export async function createShopList(shopListResource: ShopListResource): Promise<ShopListResource> {
    const user = await User.findById(shopListResource.creator).exec();
    if(!user) throw new Error("Creator is invalid. Cannot create Shoplist.");
    const sl = await ShopList.create({
        store: shopListResource.store,
        public: shopListResource.public,
        done: shopListResource.done,
        creator: shopListResource.creator,
    });
    return { id: sl._id.toString(), store: sl.store, public: sl.public, done: sl.done, createdAt: dateToString(sl.createdAt!),
        creator: sl.creator._id.toString(), creatorName: user?.name, shopItemCount: 0}

}

/**
 * Ändert die Daten einer ShopList.
 * Aktuell können nur folgende Daten geändert werden: store, public, done.
 * Falls andere Daten geändert werden, wird dies ignoriert.
 */
export async function updateShopList(shopListResource: ShopListResource): Promise<ShopListResource> {
    if (!shopListResource.id) {
        throw new Error("ShopList id missing, cannot update");
    }              
    const sl = await ShopList.findById(shopListResource.id).exec();
    if (!sl) {
        throw new Error(`No ShopList with id ${shopListResource.id} found, cannot update`);
    }
    if (shopListResource.store) sl.store = shopListResource.store;
    if (shopListResource.public!==undefined) sl.public = shopListResource.public;
    if (shopListResource.done!==undefined) sl.done = shopListResource.done;
    const user = await User.findById(sl.creator).exec();
    const shopItemCount = await ShopItem.countDocuments({shopList: sl.id});
    const savedSl = await sl.save();
    return  { id: sl.id, store: savedSl.store, public: savedSl.public, done: savedSl.done,
                creator: user?.id, creatorName: user?.name,
                createdAt: dateToString(sl.createdAt!), shopItemCount: shopItemCount}
}


/**
 * Beim Löschen wird die ShopList über die ID identifiziert.
 * Falls keine ShopList nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn die ShopList gelöscht wird, müssen auch alle zugehörigen ShopItems gelöscht werden.
 */
export async function deleteShopList(id: string): Promise<void> {
    if (!id) {
        throw new Error("No id given, cannot delete ShopList.")
    }
    const res = await ShopList.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if(res.deletedCount !== 1){
        throw new Error(`No ShopList with id ${id} deleted, probably id not valid`);
    }
    await ShopItem.deleteMany({shopList: id}).exec();
    // await Promise.all(usersShopLists.map(async (sl) => {
    //     await deleteShopList(sl.id);
    // }))
}
