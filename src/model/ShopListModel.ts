import {Schema, Types, model} from "mongoose";

export interface IShopList{
    store: string,
    public?: boolean,
    createdAt?: Date,
    done?: boolean,
    creator: Types.ObjectId
}

const myShopListSchema = new Schema <IShopList>({
    store: {type: String, required: true},
    public: {type: Boolean, default: false},
    done: {type: Boolean, default: false},
    creator: {type: Schema.Types.ObjectId, required: true, ref: "User"}
},
{timestamps: true});

export const ShopList = model<IShopList>("ShopList", myShopListSchema);