import { Sequelize } from "sequelize";
import dotenv from "dotenv";


dotenv.config();

export const accountSid = process.env.AccountSID;
export const authToken = process.env.AuthToken;
export const fromAdminPhone = process.env.fromAdminPhone;
export const APP_SECRET = process.env.APP_SECRET as string;
export const FromAdminMail = process.env.FromAdminMail as string;
export const userSubject = process.env.usersubject as string;
export const GMAIL_PASS = process.env.GMAIL_USER;
export const GMAIL_USER = process.env.GMAIL_PASS;
export const Client_ID = process.env.Client_ID;
export const Client_Secret = process.env.Client_Secret;




// for hosted DB
export const db = new Sequelize(process.env.DB_CONNECTION_STRING!, {
  logging: false,
  dialectOptions: {
    ssl: {
      require: process.env.NODE_ENV === "development" && false,
    },
  },
});

// for local connection
// export const db = new Sequelize("postgres", "postgres", "password", {
//   host: "localhost",
//   port: 5433,
//   dialect: "postgres",
//   logging: false,
//
//
// });

export const connectDB = async () => {
  try {
    await db.authenticate();
    await db.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};



