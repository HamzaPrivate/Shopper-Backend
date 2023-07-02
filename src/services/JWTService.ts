import { User } from "../model/UserModel";
import { login } from './AuthenticationService';
import { JwtPayload, sign, verify } from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config() // read ".env"
/**
 * Prüft Email und Passwort, bei Erfolg wird ein String mit einem JWT-Token zurückgegeben.
 *  
 * Die zur Unterzeichnung notwendige Passphrase wird aus der Umgebungsvariable `JWT_SECRET` gelesen,
 * falls diese nicht gesetzt ist, wird ein Fehler geworfen.
 * Die Zeitspanne, die das JWT gültig ist, also die 'Time To Live`, kurz TTL, wird der Umgebungsvariablen
 * `JWT_TTL` entnommen. Auch hier wird ein Fehler geworfen, falls diese Variable nicht gesetzt ist.
 * 
 * Wir schreiben die Rolle nur mit "u" oder "a" in das JWT, da wir nur diese beiden Rollen haben und 
 * wir das JWT so klein wie möglich halten wollen.
 * 
 * @param email E-Mail-Adresse des Users
 * @param password Das Passwort des Users
 * @returns JWT als String, im JWT ist sub gesetzt mit der Mongo-ID des Users als String sowie role mit "u" oder "a" (User oder Admin); 
 *      oder undefined wenn Authentifizierung fehlschlägt.
 */
export async function verifyPasswordAndCreateJWT(email: string, password: string): Promise<string | undefined> {
    const loggedUser = await login(email, password);
    if (!loggedUser.success) return undefined;
    //building JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw Error("JWT_SECRET not set");
    }
    const TTL = process.env.JWT_TTL;
    if (!TTL) { //number prüfen
        throw Error("JWT_TTL not set");
    }

    const timeInSec = Math.floor(Date.now() / 1000);

    const payload: JwtPayload = {
        sub: loggedUser.id,
        iat: timeInSec,
        exp: Number(TTL)+timeInSec,
        role: loggedUser.role //zu role ändern
    }
    const jwtString = sign(payload, secret, { algorithm: "HS256" });

    return jwtString;
}

/**
 * Gibt user id (Mongo-ID) und ein Kürzel der Rolle zurück, falls Verifizierung erfolgreich, sonst wird ein Error geworfen.
 * 
 * Die zur Prüfung der Signatur notwendige Passphrase wird aus der Umgebungsvariable `JWT_SECRET` gelesen,
 * falls diese nicht gesetzt ist, wird ein Fehler geworfen.
 * 
 * @param jwtString das JWT
 * @return user id des Users (Mongo ID als String) und Rolle (u oder a) des Benutzers; 
 *      niemals undefined (bei Fehler wird ein Error geworfen)
 */
export function verifyJWT(jwtString: string | undefined): {userId: string, role: "u" | "a"} {
    if(!jwtString) throw new Error("jwtString invalid");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw Error("JWT_SECRET not set");
    }
    try {
        const payload = verify(jwtString, secret);
        if (typeof payload === 'object' && "sub" in payload && payload.sub && payload.role) {
            return {userId: payload.sub, role: payload.role};
        }
    } catch(err) {
        // in case of any error
        // erzwingen, dass in fehler in dieser Methode geworfen wird anstatt der default fehler aus verify
    }
    throw new Error("invalid_token");
}
