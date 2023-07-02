import { HydratedDocument, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { createUser, deleteUser, getUsers, updateUser } from "../../src/services/UsersService";
import { UserResource } from "../../src/Resources";

var hamza: HydratedDocument<IUser>; 
var userResource: UserResource; 
beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
     hamza = await User.create({
        name: "Hamza",
        email: "hamza@example.com",
        password: "123",
        admin: false
    })
    userResource = {name: "someName",  email: "MAILTHATSLOWERCASED", admin: false, password: "somePw"}
    //await hamza.save(); NICHT NÖTIG WEIL ÜBER CREATE WIRD DIREKT GESAVED
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("getUsers",async ()=>{
    const res ={users: [{id: hamza.id, name: hamza.name, email: hamza.email, admin: hamza.admin!}]}
    expect(await getUsers()).toStrictEqual(res)
})

test("createUser",async ()=>{
    let createdUser = await createUser(userResource);
    expect((await getUsers()).users.length).toBe(2);
    expect(createdUser.name).toBe("someName")
    expect(createdUser.admin).toBe(false)
    expect(createdUser.email).toBe("mailthatslowercased")
    //undefined, weil kein pw zurückgegeben werden soll aus security
    expect(createdUser.password).toBe(undefined)
})

test("updateUser",async ()=>{
    let createdUser = await createUser(userResource);
    createdUser.name = "someUpdate";
    let updatedUser = await updateUser(createdUser);
    expect((await getUsers()).users.length).toBe(2);
    expect(updatedUser.name).toBe("someUpdate")
    expect(updatedUser.admin).toBe(false)
    expect(updatedUser.email).toBe("mailthatslowercased")
    //undefined, weil kein pw zurückgegeben werden soll aus security
    expect(updatedUser.password).toBe(undefined)
})

test("updateUser with error",async ()=>{
    let createdUser = await createUser(userResource);
    createdUser.id = new Types.ObjectId(4234).toString();
    await expect(()=> updateUser(createdUser)).rejects.toThrow();
    createdUser.id = undefined;
    await expect(()=> updateUser(createdUser)).rejects.toThrow();
})

test("deleteUser", async () => {
    expect((await getUsers()).users.length).toBe(1);
    const res = await deleteUser(hamza.id);
    expect((await getUsers()).users.length).toBe(0);
})

test("deleteUser with error", async () => {
    await expect(()=>deleteUser("")).rejects.toThrow();
    const res = await deleteUser(hamza.id);
    expect((await getUsers()).users.length).toBe(0);
    await expect(()=>deleteUser(hamza.id)).rejects.toThrow();
})
