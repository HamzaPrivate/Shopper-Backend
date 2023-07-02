import express from "express";
import { LoginResource } from "../Resources" //NEU
import { body, matchedData, validationResult } from "express-validator";
import { login } from "../services/AuthenticationService";
import { verifyPasswordAndCreateJWT } from "../services/JWTService";

// Implementierung wird Teil eines nächsten Aufgabenblattes.

const loginRouter = express.Router();

/**
 * Diese Funktion bitte noch nicht implementieren, sie steht hier als Platzhalter.
 * Wir benötigen dafür Authentifizierungsinformationen, die wir später in einem JSW speichern.
 */
loginRouter.post("/",
    body('password').isStrongPassword().isLength({ min: 1, max: 100 }),
    body('email').isEmail().isLength({ max: 100 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const loginData: { email: string, password: string } = req.body;
        try {
            const loginRes = await verifyPasswordAndCreateJWT(loginData.email, loginData.password);
            if (loginRes) {
                const jwt: LoginResource = {
                    access_token: loginRes!,
                    token_type: "Bearer"
                }
                res.status(201).send(jwt);
            }
            else{
                res.sendStatus(401);
            }
        } catch (err) {
            res.status(400);
            next(err);
        }
    })

export default loginRouter;