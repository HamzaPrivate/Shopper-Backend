import { Types } from "mongoose";
import { ShopItemResource } from "../Resources";
import { ShopItem } from "../model/ShopItemModel";
import { IShopList, ShopList } from "../model/ShopListModel";
import { IUser, User } from "../model/UserModel";
import { dateToString } from "./ServiceHelper";

/**
 * Liefert die ShopItemResource mit angegebener ID.
 * Falls kein ShopItem gefunden wurde, wird ein Fehler geworfen.
 */
export async function getShopItem(id: string): Promise<ShopItemResource> {
    if (!id) throw new Error("ShopItem id not valid");
    const si = await ShopItem.findById({ _id: new Types.ObjectId(id) })
        .populate<{ shopList: IShopList & { id: string } }>("shopList").exec();
    if (!si) throw new Error(`Keine ShopItem gefunden unter der ID: ${id}`);
    const user = await User.findById({ _id: new Types.ObjectId(si.creator) }).exec();
    return {
        id: si.id, name: si.name, quantity: si.quantity, remarks: si.remarks,
        creator: user?.id, creatorName: user?.name, createdAt: dateToString(si.createdAt!),
        shopList: si.shopList.id, shopListStore: si.shopList.store
    };
}

/**
 * Erzeugt ein ShopItem.
 * Daten, die berechnet werden aber in der gegebenen Ressource gesetzt sind, werden ignoriert.
 * Falls die Liste geschlossen (done) ist, wird ein Fehler wird geworfen.
 */
export async function createShopItem(shopItemResource: ShopItemResource): Promise<ShopItemResource> {
    const user = await User.findById(shopItemResource.creator).exec();
    if (!user) throw new Error("CreatorID is invalid, cannot create shopitem.");
    const sl = await ShopList.findById(shopItemResource.shopList).exec();
    if (!sl) throw new Error("ShopListID is invalid, cannot create shopitem.");
    if (sl?.done === true) {
        throw new Error("ShopList is closed. Therfore no new item can be inserted.");
    }
    const popItem = await ShopItem.create({
        name: shopItemResource.name,
        quantity: shopItemResource.quantity,
        remarks: shopItemResource.remarks,
        createdAt: shopItemResource.createdAt,
        shopList: shopItemResource.shopList,
        creator: shopItemResource.creator
    });

    return {
        id: popItem.id, name: popItem.name, quantity: popItem.quantity, remarks: popItem.remarks,
        creator: user?.id, creatorName: user?.name,
        createdAt: dateToString(popItem.createdAt!), shopList: sl?.id, shopListStore: sl?.store
    }
}

/**
 * Updated eine ShopItem. Es können nur Name, Quantity und Remarks geändert werden.
 * Aktuell können ShopItems nicht von einem ShopList in einen anderen verschoben werden.
 * Auch kann der Creator nicht geändert werden.
 * Falls die ShopList oder Creator geändert wurde, wird dies ignoriert.
 */
export async function updateShopItem(shopItemResource: ShopItemResource): Promise<ShopItemResource> {
    if (!shopItemResource.id) {
        throw new Error("ShopItem id missing, cannot update");
    }
    const si = await ShopItem.findById(shopItemResource.id).populate<{ creator: IUser & { id: string }, shopList: IShopList & { id: string } }>([
        { path: "creator" },
        { path: "shopList" }
    ])
        .exec();
    if (!si) {
        throw new Error(`No ShopItem with id ${shopItemResource.id} found, cannot update`);
    }
    if (shopItemResource.name) si.name = shopItemResource.name;
    if (shopItemResource.quantity) si.quantity = shopItemResource.quantity;
    if (shopItemResource.remarks) si.remarks = shopItemResource.remarks;

    const savedSi = await si.save();
    return {
        id: si.id, name: savedSi.name, quantity: savedSi.quantity, remarks: savedSi.remarks,
        creator: si.creator.id, creatorName: si.creator.name,
        createdAt: dateToString(si.createdAt!), shopList: si.shopList.id, shopListStore: si.shopList.store
    }
}


/**
 * Beim Löschen wird das ShopItem über die ID identifiziert.
 * Falls es nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 */
export async function deleteShopItem(id: string): Promise<void> {
    if (!id) {
        throw new Error("No id given, cannot delete ShopItem.")
    }
    const res = await ShopItem.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (res.deletedCount !== 1) {
        throw new Error(`No ShopItem with id ${id} deleted, probably id not valid`);
    }
}


