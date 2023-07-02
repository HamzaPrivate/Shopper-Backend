import {Schema, Types, model} from "mongoose";

export interface IShopItem{
    name: string,
    quantity: string,
    remarks?: string,
    createdAt?: Date,
    shopList: Types.ObjectId,
    creator: Types.ObjectId
}

const myShopItemSchema = new Schema<IShopItem>({
    name: {type: String, required: true},
    quantity: {type: String, required: true},
    remarks: String, //abgekürzt
    shopList: {type: Schema.Types.ObjectId, required: true, ref: "ShopList"},
    creator: {type: Schema.Types.ObjectId, required: true, ref: "User"}
},
{timestamps: true});//createdAt somit automatisch angelegt vom Typ Date

export const ShopItem = model<IShopItem>("ShopItem", myShopItemSchema);