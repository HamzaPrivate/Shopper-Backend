import express from "express";
import { createUser, deleteUser, updateUser } from "../services/UsersService";
import { UserResource } from "../Resources" //NEU
import { ExpressValidator, body, matchedData, param, validationResult } from "express-validator";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { User } from "../model/UserModel";

// Aufbau: Vgl. Folie 119

const userRouter = express.Router();

userRouter.post("/",
    body('email').isEmail().normalizeEmail().isLength({ max: 100 }),
    body('admin').optional().isBoolean(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('password').isStrongPassword().isLength({ max: 100 }),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userResource = matchedData(req) as UserResource;
        try {
            if (req.role == "u")throw new Error("Action cannot be executed without admin rights")
            const createdUserResource = await createUser(userResource);
            res.status(201).send(createdUserResource);
        } catch (err) {
            res.status(400);
            if (req.role == "u")res.status(403);
            next(err);
        }
    })

userRouter.put("/:id",
    param("id").isMongoId(),
    body("id").isMongoId(),
    body('email').isEmail().normalizeEmail().isLength({ max: 100 }),
    body('admin').isBoolean(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('password').optional().isStrongPassword().isLength({ max: 100 }),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userID = req.params!.id;
        const userResource = matchedData(req) as UserResource;
        if (userID !== userResource.id) {
            res.status(400);
            next("Invalid ID")
        }
        else {
            try {
                if (req.role == "u")throw new Error("Action cannot be executed without admin rights")
                const updatedUserResource = await updateUser(userResource)
                res.send(updatedUserResource);
            } catch (err) {
                res.status(400); // duplicate user, we do not want show that
                if (req.role == "u")res.status(403);
                next(err);
            }
        }
    }
)

userRouter.delete("/:id",
    param("id").isMongoId(),
    requiresAuthentication,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const userID = req.params!.id;
            const user = await User.findById(userID).exec();
            if(!user || req.role == "a"){
                res.sendStatus(403)
            }
            await deleteUser(userID);
            res.sendStatus(204)
        } catch (err) {
            res.status(400);
            next(err);
        }
    })

export default userRouter;