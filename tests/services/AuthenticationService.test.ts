import { login } from "../../src/services/AuthenticationService"
import { HydratedDocument } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";

var user: HydratedDocument<IUser>; 
beforeAll(async()=> await DB.connect());
beforeEach(async()=>{
     user = await User.create({
        name: "Hamza",
        email: "hamza@example.com",
        password: "123",
        admin: true
    })
    //await hamza.save(); NICHT NÖTIG WEIL ÜBER CREATE WIRD DIREKT GESAVED
});
afterEach(async ()=> await DB.clear());
afterAll(async ()=> await DB.close());

test("success true on normal login",async () => {
    const res = {success: true, id: user.id, name: user.name, role: "a"};
    expect(await login("hamza@example.com", "123")).toStrictEqual(res);
})


test("success false coz bad args",async () => {
    expect(await login("", "")).toStrictEqual({success: false});
})

