import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";

beforeAll(async () => await DB.connect())
afterEach(async () => await DB.clear())
afterAll(async () => await DB.close())

const john: IUser = { email: "john@doe.de", name: "John", password: "1234", admin: false}
const jane: IUser = { email: "jane@doe.de", name: "Jane", password: "1234" }

test("addUser with hashed password", async () => {
    const user = new User(john)
    expect(user).toBeDefined();
    expect(user.name).toBe(john.name);

    // we have not saved yet
    expect(user.password).toBe(john.password);

    await user.save()
    // pre-save hook has hashed password
    expect(user.password).not.toBe(john.password);
})
/**
 * pre "save" hook with document (pre-save)
 */
test("change and save password", async () => {
    const u1 = new User(john)
    await u1.save();
    expect(u1).toBeDefined();
    expect(u1.name).toBe(john.name);
    expect(u1.password).not.toBe(john.password);
    const hashedPW1 = u1.password;

    u1.set("password", "abcd");
    expect(u1.password).toBe("abcd");
    await u1.save();
    expect(u1.password).not.toBe("abcd");
    expect(u1.password).not.toBe(hashedPW1);

    const u2 = await User.findOne({ email: john.email }).exec();
    if (u2 == null) {
        throw new Error("User nach Update nicht gefunden")
    }
    expect(u2.name).toBe(john.name);
    expect(u2.password).not.toBe(john.password);
    expect(u2.password).not.toBe(hashedPW1);
})

/**
 * pre "updateOne" hook with document (pre-updateOne)
 */
test("updateOne - password", async () => {
    const u1 = new User(john)
    await u1.save();
    let oldPw = u1.password;
    // console.log(oldPw)
    await User.updateOne({name: "John"}, {password: "NEUESPW"}).exec(); 
    let res = await User.find({name: "John"}).exec(); 
    let newPw = res[0].password;
    // console.log(newPw)
    expect(oldPw).not.toBe(newPw);
})

/**
 * pre "updateOne" hook with document (pre-updateOne)
 */
test("updateOne - admin", async () => {
    const u1 = new User(john)
    await u1.save();
    let oldAdmin = u1.admin;
    // console.log(oldPw)
    await User.updateOne({name: "John"}, {admin: true}).exec(); 
    let res = await User.find({name: "John"}).exec(); 
    let newAdmin = res[0].admin;
    // console.log(newPw)
    expect(oldAdmin).not.toBe(newAdmin);
})

test("updateMany - password", async () => {
    const u1 = new User(john)
    await u1.save();
    await User.create({
        name: "Joh",
        email: "john@example.com",
        password: "1234",
        admin: false
    });                                     //updateMany im Hinblick auf Passwortänderung doch gar nicht möglich
    await User.updateMany({admin: "false"}, {password: "NEUESPW"}); //mehrere passwörter geupdated?
    let joh = await User.find({name: "Joh", email: "john@example.com"}).exec();  
    let jo = await User.find({name: "John"}).exec(); 
    expect(joh[0].password).toBe(jo[0].password);   //remove not after debugging
})

test("isCorrectPw positive test",async () => {
    let user = new User(john);
    let plainPassword = user.password;
    let hashedPassword = (await user.save()).password;
    await expect(user.isCorrectPassword(plainPassword)).resolves.toBe(true);
})

test("isCorrectPw negative test",async () => {
    let user = new User(john);
    let plainPassword = user.password;
    let hashedPassword = (await user.save()).password;
    await expect(user.isCorrectPassword(plainPassword+"blabla")).resolves.toBe(false);
})

test("isCorrectPw throw error",async () => {
    let user = new User(john);
    let res = await user.save();
    user.password = "trigger error pls";
    await expect(user.isCorrectPassword(res.password)).rejects.toThrow()
})

test("comparePassword with saved user", async () => {
    const user = new User(john)
    expect(user).toBeDefined();
    expect(user.name).toBe(john.name);

    // we have not saved yet
    expect(user.password).toBe(john.password);

    await user.save()
    // pre-save hook has hashed password
    expect(user.password).not.toBe(john.password);

    expect(await user.isCorrectPassword(john.password)).toBeTruthy();
    expect(await user.isCorrectPassword("Another password")).toBeFalsy();
    expect(await user.isCorrectPassword(user.password)).toBeFalsy();
})



