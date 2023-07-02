import express from "express";
import { createShopList, deleteShopList, getShopList, updateShopList } from "../services/ShopListService";
import { ShopListResource } from "../Resources" //NEU
import { body, matchedData, param, validationResult } from "express-validator";
import { ShopList } from "../model/ShopListModel";
import { optionalAuthentication, requiresAuthentication } from "./authentication";

// Aufbau: Vgl. Folie 119

const shopListRouter = express.Router();

shopListRouter.post("/",
    body('store').isString().isLength({ max: 100 }),
    body('public').optional().isBoolean(),
    body('done').optional().isBoolean(),
    body('creator').isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const shopListResource = matchedData(req) as ShopListResource;
            const createdShopListResource = await createShopList(shopListResource);
            res.status(201).send(createdShopListResource);
        } catch (err) {
            res.status(400);
            next(err);
        }
    })

shopListRouter.get("/:id",
    param("id").isMongoId(),
    optionalAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const shopListID = req.params!.id;
        try {
            const shopList = await getShopList(shopListID)
            if (!shopList.public) {
                if (req.userId != shopList.creator) {
                    res.sendStatus(403);
                }
            }
            res.send(shopList);
            //next hier wäre sinnlos da send schon abschickt und next gar nicht mehr aufgerufen wird
        } catch (err) {
            res.status(404);
            next(err);
        }
    })

shopListRouter.put("/:id",
    param("id").isMongoId(),
    body("id").isMongoId(),
    body('store').isString().isLength({ min: 1, max: 100 }),
    body('public').isBoolean(),
    body('done').isBoolean(),
    body("creator").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const shopListID = req.params!.id;
        const shopListResource = matchedData(req) as ShopListResource;
        if (shopListID !== shopListResource.id) {
            res.status(400);
            next("Invalid ID")//throw error
        }
        else {
            try {
                const creator =  (await getShopList(shopListID)).creator;
                if (req.userId!=creator) {
                    res.sendStatus(403);
                }
                const updatedShopListResource = await updateShopList(shopListResource)
                res.send(updatedShopListResource);
            } catch (err) {
                res.status(400); // duplicate shopList, we do not want show that
                next(err);
            }
        }
    })

shopListRouter.delete("/:id",
    param("id").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const shopListID = req.params!.id;
            const creator =  (await getShopList(shopListID)).creator;
                if (req.userId!=creator){
                    res.sendStatus(403)
                }
            await deleteShopList(shopListID);
            res.sendStatus(204)
        } catch (err) {
            res.status(404);
            next(err);
        }
    })

export default shopListRouter;