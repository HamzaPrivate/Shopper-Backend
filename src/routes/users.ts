import express from "express";
import { getUsers } from "../services/UsersService";
import { optionalAuthentication, requiresAuthentication } from "./authentication";

// Aufbau: Vgl. Folie 119

const usersRouter = express.Router();
//http get request
usersRouter.get("/", requiresAuthentication, async (req, res, next) => {
    try {
        if (!req.userId) throw Error("Not permitted")
        if (req.role == "u") throw Error("Action cannot be executed without admin rights")
        const users = await getUsers();
        res.send(users)// 200 by default
    } catch (err) {
        res.status(403);
        next(err)
    }
});

export default usersRouter;