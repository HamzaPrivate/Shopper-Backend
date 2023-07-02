import {Model, Query, Schema, model} from "mongoose";
import bcrypt from "bcryptjs";

//interface
export interface IUser {
    email: string,
    name: string,
    password: string
    admin?: boolean
}

/**
 * Type-Alias zum "Einmischen" der Methoden
 */
type UserModel = Model<IUser, {}, IUserMethods>;

/**
 * Methoden werden in einem eigenen Interface definiert und später eingemischt.
 */
interface IUserMethods {
    isCorrectPassword(hashedPassword: string): Promise<boolean>
}

//schema
const myUserSchema = new Schema<IUser, UserModel>({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    admin: {type: Boolean, default: false}         
});


//CUSTOM METHODS
/**
 * Hook wenn die Instanzmethode save aufgerufen wird.
 * Wir benötigen meist noch andere, wie etwa udpateOne etc.
 */
myUserSchema.pre("save",{ document: true, query: false} ,async function () {
    if (this.isModified("password")) {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
    }
});

// myUserSchema.pre("updateOne", { document: true, query: false }, async function () {
//     if(this.isModified("password")){     ########################PW WIRD BEI DIESER VARIANTE NICHT GEHASHED, QUERY NÖTIG
//         const hashedPassword = await bcrypt.hash(this.password, 10);
//         this.password = hashedPassword; //evtl hier query nötig
//     }
// });

//                          {dies ist optional} - gibt an ob "this" document oder eine query ist
myUserSchema.pre("updateOne",{ document: false, query: true } ,async function () {
    const update = this.getUpdate() as Query<any, IUser> & { password?:
        string } | null;
    if(update?.password){
        let hashed = await bcrypt.hash(update.password, 10)
        update.password = hashed;
    }
});

myUserSchema.pre("updateMany",{ document: false, query: true } ,async function () {
    const update = this.getUpdate() as Query<any, IUser> & { password?:
        string } | null;
    if(update?.password){//password nicht falsy ist
        const hashedPassword = await bcrypt.hash(update?.password, 10);
        update.password = hashedPassword; 
    }
  });
  

/**
 * Implementierung der Methode
 */
myUserSchema.method("isCorrectPassword",
    async function (plainPassword: string): Promise<boolean> {
        if (this.isModified()) {
            throw new Error("User is modified, cannot compare passwords");
        }
        const result = await bcrypt.compare(plainPassword,this.password);
        return result;
    });





/**
 * Auch hier das UserModel verwenden!
 */
export const User = model<IUser, UserModel>("User", myUserSchema);

// Achtung: Hooks müssen VOR der Erzeugung des Modells angemeldet werden!
// Hier dürfen also keine Hooks oder andere Methoden definiert werden!

