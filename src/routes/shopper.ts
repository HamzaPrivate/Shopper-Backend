import express from "express";
import { getShopper } from "../services/ShopperService";
import { getUsers } from "../services/UsersService";//?
import { ShopperResource } from "../Resources" //NEU
import { optionalAuthentication } from "./authentication";

// Aufbau: Vgl. Folie 119

const shopperRouter = express.Router();

shopperRouter.get("/", optionalAuthentication ,async (req, res, next) => {
    const shopLists = await getShopper(req.userId)
    res.send(shopLists);
})

export default shopperRouter;