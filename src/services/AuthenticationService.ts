import { User } from "../model/UserModel";

/**
 * Prüft Email und Passwort, bei Erfolg wird die ID und der Name des Users zurückgegeben
 * und success ist true. Groß-/Kleinschreibung bei der E-Mail ist zu ignorieren.
 * Falls kein User mit gegebener EMail existiert oder das Passwort falsch ist, wird nur 
 * success mit falsch zurückgegeben. Aus Sicherheitsgründen wird kein weiterer Hinweis gegeben.
 */
export async function login(email: string, password: string): Promise<{ success: boolean, id?: string, name?: string, role?: "u" | "a" }> {
    if (email && password) {
        let user = await User.findOne({ email: email.trim().toLowerCase() }).exec();
        if (user?.id) {
            if (await user.isCorrectPassword(password)) {
                let role: "u" | "a" = "u"
                if (user.admin) {
                    role = "a";
                }
                return { success: true, id: user.id, name: user.name, role: role };
            }
        }
    }
    return { success: false };
}