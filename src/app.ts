import express from 'express';
import "express-async-errors" // needs to be imported before routers and other stuff!
import loginRouter from './routes/login';
import shopListShopItemsRouter from './routes/shoplistshopitems';
import userRouter from './routes/user';
import usersRouter from './routes/users';
import shopperRouter from './routes/shopper';
import shoplistRouter from './routes/shoplist';
import shopitem from './routes/shopitem';



const app = express();

// Middleware:
app.use('*', express.json())

// Routes
app.use(shopListShopItemsRouter) // wird hier ohne Präfix registriert, da er bereits einen Präfix hat (dies ist aber die Ausnahme)
app.use("/api/login", loginRouter)   // wird erst später implementiert, hier nur Dummy; hat aber bereits einen Präfix

// Registrieren Sie hier die weiteren Router (mit Pfad-Präfix):
app.use("/api/user", userRouter)
app.use("/api/users", usersRouter)
app.use("/api/shopper", shopperRouter)
app.use("/api/shoplist", shoplistRouter)
app.use("/api/shopitem",shopitem)




export default app;