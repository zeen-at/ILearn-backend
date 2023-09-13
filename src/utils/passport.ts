// import { urlencoded } from "express";
// import {  VerifyCallback } from "jsonwebtoken";
// import * as passport from "passport";
// // import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Strategy as GoogleStrategy, StrategyOptionsWithRequest, _StrategyOptionsBase } from "passport-google-oauth20";
// import { UUIDV4 } from "sequelize";
// import { GoogleUserInstance } from "../model/googleUserModel";
// import { UserInstance } from "../model/userModel";



// // passport.use(new GoogleStrategy({
// //     clientID: process.env.Client_ID!,
// //     clientSecret: process.env.Client_Secret!,
// //     callbackURL: `${process.env.BASE_URL}/auth/google/callback`
// //   },
// //   (accessToken: string, refreshToken: string, profile: any, cb: (err: any, user: any) => void) => {
// //     // callback function to process the user data
// //     UserInstance.findOrCreate({ googleId: profile.id }, (err: any, user: any) => {
// //       return cb(err, user);
// //     });
// //   }
// // ));
// const googleLogin = {
//     clientID: process.env.Client_ID,
//     clientSecret: process.env.Client_Secret
// }

// const options:StrategyOptionsWithRequest = {
//     clientID: googleLogin.clientID!,
//     clientSecret: googleLogin.clientSecret!,
//     callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
//     passReqToCallback: true
// }

// const verify = async (req: Express.Request, accessToken: string, requestToken: string, profile: passport.Profile, done: VerifyCallback) => {

//     let existingUser = await UserInstance.findOne({where:{"google.id": profile.id}})
//     if(existingUser){
//         return done(null, profile)
//     }
//     const newUser = new GoogleUserInstance({
//         method: "google",
//         google: {
//             name: profile.displayName,
//             id: profile.id,
//             email: profile.emails && profile.emails[0].value
//         }
        
//     })
//     await newUser.save();
//     return done(null, newUser)
//     // GoogleUserInstance.findOrCreate(profile.email)
//     // return done(null, profile)
// }

// export const passportUse = (passport: { use: (arg0: GoogleStrategy) => void; }) => {
//     passport.use(new GoogleStrategy(options, verify))
// }

