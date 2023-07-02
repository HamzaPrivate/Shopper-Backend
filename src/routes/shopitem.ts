import express from "express";
import { createShopItem, deleteShopItem, getShopItem, updateShopItem } from "../services/ShopItemService";
import { ShopItemResource } from "../Resources" //NEU
import { body, matchedData, param, validationResult } from "express-validator";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { getShopList } from "../services/ShopListService";

// Aufbau: Vgl. Folie 119

const shopItemRouter = express.Router();

shopItemRouter.post("/",
    body("name").isString().isLength({ min: 1, max: 100 }),
    body("quantity").isString().isLength({ min: 1, max: 100 }),
    body("remarks").optional().isString().isLength({ min: 1, max: 100 }),
    body("creator").isMongoId(),
    body("shopList").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const shopItem = matchedData(req) as ShopItemResource;
            const shopList = await getShopList(shopItem.shopList);
            if(!shopList.public){
                if (req.userId != shopList.creator) {
                    res.sendStatus(403)
                }
            }
            const createdShopItemResource = await createShopItem(shopItem);
            res.status(201).send(createdShopItemResource);
        } catch (err) {
            res.status(400);
            next(err);
        }
    })

shopItemRouter.get("/:id",
    param("id").isMongoId(),
    optionalAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const shopItemId = req.params?.id;
        try {
            const shopItem = await getShopItem(shopItemId)
            const shopList = await getShopList(shopItem.shopList);
            if (!shopList.public) {
                if ((req.userId != shopList.creator) && (req.userId != shopItem.creator)) {
                    res.sendStatus(403)
                }
            }
            res.send(shopItem);
        } catch (err) {
            res.status(404);
            next(err)
        }
    })

shopItemRouter.put("/:id",
    param("id").isMongoId(),
    body("id").isMongoId(),
    body("name").isString().isLength({ min: 1, max: 100 }),
    body("quantity").isString().isLength({ min: 1, max: 100 }),
    body("remarks").optional().isString().isLength({ min: 1, max: 100 }),
    body("creator").isMongoId(),
    body("shopList").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const shopItemID = req.params?.id;
        const shopItemResource = req.body as ShopItemResource;
        if (shopItemID !== shopItemResource.id) {
            res.status(400);
            next("Invalid ID")
        } else {
            try {
                const shopItem = await getShopItem(shopItemID)
                const shopList = await getShopList(req.body.shopList);
                if ((req.userId != shopList.creator) && (req.userId != shopItem.creator)) {
                    res.sendStatus(403)
                }
                const updatedShopItemResource = await updateShopItem(shopItemResource)
                res.send(updatedShopItemResource);
            } catch (err) {
                res.status(400);
                next(err);
            }
        }
    })

shopItemRouter.delete("/:id",
    param("id").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const shopItemID = req.params?.id;
            const shopItem = await getShopItem(shopItemID)
            const shopList = await getShopList(shopItem.shopList);
            if ((req.userId != shopList.creator) && (req.userId != shopItem.creator)) {
                res.sendStatus(403)
            }
            await deleteShopItem(shopItemID);
            res.sendStatus(204)
        } catch (err) {
            res.status(404);
            next(err);
        }
    })

export default shopItemRouter;