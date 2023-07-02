import { Types } from "mongoose";
import { UserResource, UsersResource } from "../Resources";
import { User } from "../model/UserModel";
import { ShopList } from "../model/ShopListModel";
import { deleteShopList, getShopList } from "./ShopListService";




/**
 * Die Passwörter dürfen nicht zurückgegeben werden.
 */
export async function getUsers(): Promise<UsersResource> {
    //returns all docs from UserModel as a array
    const users = await User.find({}).exec();
    const userResource = {
        users: users.map(user => ({ id: user.id, name: user.name, email: user.email, admin: user.admin! }))
    } //this happens for each element in the array of users
    return userResource;
}

/**
 * Erzeugt einen User. Die E-Mail-Adresse wird in Kleinbuchstaben umgewandelt.
 * Das Password darf nicht zurückgegeben werden.
 */
export async function createUser(userResource: UserResource): Promise<UserResource> {
    const user = await User.create({
        name: userResource.name,
        email: userResource.email.trim().toLowerCase(),
        admin: userResource.admin,
        password: userResource.password
    });
    return { id: user.id, name: user.name, email: user.email, admin: user.admin! }
}

/**
 * Updated einen User. Die E-Mail-Adresse, falls angegeben, wird in Kleinbuchstaben umgewandelt.
 * Beim Update wird der User über die ID identifiziert.
 * Der Admin kann einfach so ein neues Passwort setzen, ohne das alte zu kennen.
 */
export async function updateUser(userResource: UserResource): Promise<UserResource> {
    if (!userResource.id) throw new Error("User id missing, cannot update");
    const user = await User.findById(userResource.id).exec();
    if (!user) {
        throw new Error(`No user with id ${userResource.id} found, cannot update`);
    }
    if (userResource.email) {
        userResource.email = userResource.email.toLowerCase();
        if (userResource.email !== user.email) {
            const c = await User.count({ email: userResource.email })
                .exec();
            if (c > 0) {
                throw new Error(`Duplicate email`);
            }
        }
        user.email = userResource.email;
    }
    if (userResource.name) {
        userResource.name = userResource.name;
        if (userResource.name !== user.name) {
            const c = await User.count({ name: userResource.name })
                .exec();
            if (c > 0) {
                throw new Error(`Duplicate name`);
            }
        }
        user.name = userResource.name;
    }
    if (userResource.name) user.name = userResource.name;
    if (userResource.email) user.email = userResource.email;
    if (userResource.admin !== undefined) user.admin = userResource.admin;
    if (userResource.password) user.password = userResource.password;

    const savedUser = await user.save();
    return { id: savedUser.id, name: savedUser.name, email: savedUser.email, admin: savedUser.admin! }
}

/**
 * Beim Löschen wird der User über die ID identifiziert. 
 * Falls Benutzer nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn der User gelöscht wird, müssen auch alle zugehörigen ShopLists und ShopItems gelöscht werden.
 */
export async function deleteUser(id: string): Promise<void> {
    //nach aufg soll status code returned werden?
    if (!id) throw new Error("no id given, cannot delete user");
    const res = await User.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    const usersShopLists = await ShopList.find({ creator: id }).exec();
    await Promise.all(usersShopLists.map(async (sl) => {
        await deleteShopList(sl.id);
    }))
    if (res.deletedCount !== 1) {
        throw new Error(`No user with id ${id} deleted, probably id not valid`);
    }
}