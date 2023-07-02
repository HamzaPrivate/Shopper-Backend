import { HydratedDocument } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";

var hamza: HydratedDocument<IUser>; 
beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
     hamza = await User.create({
        name: "Hamza",
        email: "hamza@example.com",
        password: "123",
        admin: false
    })
    //await hamza.save(); NICHT NÖTIG WEIL ÜBER CREATE WIRD DIREKT GESAVED
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("user exists1", async ()=>{
    await hamza.save();//der erste hamza wird durch create gesaved und hier durch das save nochmal überschrieben daher length = 1
    let users = await User.find({name: "Hamza"}).exec();
    expect(users.length).toBe(1);
});

test("user exists2", async ()=>{
    let users = await User.find({email: "hamza@example.com"}).exec();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Hamza");
    expect(users[0].email).toBe("hamza@example.com");
    expect(users[0].password).not.toBe("123"); //not because password hash
    expect(users[0].admin).toBe(false);
});

test("sth", async ()=>{
    let users = await User.find({email: "hamza@example.com"}).exec();
    expect(users[0].id).toBeDefined();
})

//Test Code von Prof. Pilgrim übernommen siehe moodle gitlab link zum code
test("addUser", async () => {
    const user = await User.create({ name: "John", email: "john@doe.com", password: "123" }) 
    //in der vorgegebenen git datei von pilgrim nicht mit create gearbeitet warum?
    const res = await user.save();
    expect(res).toBeDefined();
    expect(res.name).toBe("John");
    expect(res.id).toBeDefined();
})

test("deleteUser", async () => {
    await hamza.deleteOne();
    let res = await User.find({name: "Hamza"}).exec();
    expect(res).toEqual([]);
})

/**
 * updateOne and findOne
 */
test("updateOne and findeOne", async () => {
    const user = new User({ name: "John", email: "john@doe.com", password: "123" })
    const res = await user.save();

    // receiver is Model, i.e. we use a query
    const updateResult = await User.updateOne({ email: "john@doe.com" }, { name: "Bob", email: "bob@bht.de" });
    expect(updateResult.matchedCount).toBe(1);
    expect(updateResult.modifiedCount).toBe(1);
    expect(updateResult.acknowledged).toBeTruthy();

    const u2 = await User.findOne({ email: "john@doe.com" }).exec();
    if (u2) {
        throw new Error("User nach Update gefunden, obwohl EMail verändert wurde")
    }

    const u3 = await User.findOne({ email: "bob@bht.de" }).exec();
    if (!u3) {
        throw new Error("Use nach Update unter neuer EMail nicht gefunden")
    }
    expect(u3.name).toBe("Bob");

})

/**
 * Test auf Verletzung des Uniqueness-Constraints
 */
test("Duplicate email", async () => {
    const user = new User({ name: "John", email: "johnX@some-host.de", password: "123" });
    const savedUser = await user.save();
    expect(savedUser).toBeDefined();

    const user2 = new User({ name: "Jack", email: "johnX@some-host.de", password: "1233" });
    // wir übergeben expect eine Lambda, so kann expect den Fehler fangen, der beim Aufruf der eigentlichen Funktion auftritt,
    // und verarbrbeiten
    await expect(() => user2.save()).rejects.toThrowError(); // wir benötigen hier noch "rejects"
});