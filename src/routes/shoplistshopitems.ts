// Vorlage für den Einstieg

import express from "express";
import { getShopListItems } from "../services/ShopListItemsService";
import { body, param, validationResult } from "express-validator";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { getShopList } from "../services/ShopListService";

// Aufbau: Vgl. Folien 124 ff

const shopListShopItemsRouter = express.Router();

shopListShopItemsRouter.get("/api/shoplist/:id/shopitems",
    param("id").isMongoId(),
    optionalAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params.id;
            const shopList = await getShopList(id);
            if (shopList.public || req.userId == shopList.creator) {
                const shopItems = await getShopListItems(req.params!.id);
                res.send(shopItems); // 200 by default
            }
            else {
                res.sendStatus(403)
            }
        } catch (err) {
            res.status(404); // not found
            next(err);
        }
    })

export default shopListShopItemsRouter;