import { Application, Request, Response } from "express";
import { v4 as UUID } from "uuid";
import passport from "passport";
import passportFacebook from "passport-facebook";
const FacebookStrategy = passportFacebook.Strategy;
import session from "express-session";
import { UserAttributes, UserInstance } from "../../model/userModel";
import { GeneratePassword, GenerateSalt, GenerateSignature } from "../utility";
import { UserPayload } from "../../interface/user.dto";

export const fboauthBackend = async (app: Application) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET||"string" as string,
      saveUninitialized: false,
      resave: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (obj: string, cb) {
    cb(null, obj);
  });

  passport.use(
    new FacebookStrategy(
      {
        clientID:process.env.FACEBOOK_CLIENT_ID as string,
        clientSecret:process.env.FACEBOOK_CLIENT_SECRET as string,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL  as string,
        authorizationURL: "https://www.facebook.com/v10.0/dialog/oauth",
        tokenURL: "https://graph.facebook.com/v10.0/oauth/access_token",
        profileFields: [
          "id",
          "displayName",
          "email",
          "gender",
          "picture.type(large)",
        ],
      },
      async function (
        accessToken: any,
        refreshToken: any,
        profile: any,
        done: any
      ) {
        profile.accessToken = accessToken;
        done(null, profile);
      }
    )
  );
  app.get("/facebook", passport.authenticate("facebook"));

  app.get(
    "/facebook/auth/:secrets",
    passport.authenticate("facebook", {
      successRedirect: "/facebook/profile",
      scope: ["email", "public_profile"],
      failureRedirect: "/failed",
    })
  );

  app.get("/failed", (req: Request, res: Response) => {
    return res.redirect(`${process.env.CLIENT_URL}/auth/social/?token=error`);
  });

  app.get("/facebook/profile", async (req: any, res: any) => {
    try {
      const { accessToken, email, displayName, id, gender, photos } = req.user;
      console.log(accessToken, email, displayName, id, gender, photos)
      let userName = displayName.split(" ")[0];
      const user = (await UserInstance.findOne({
        where: {
          facebookId: id,
        },
      })) as unknown as UserAttributes;
      if (!user) {
        const uuiduser = UUID();
        const salt = await GenerateSalt();
        const userPassword:any = await GeneratePassword(userName, salt);
        const newUser = (await UserInstance.create({
          id: uuiduser,
          email: email || `${id}@gmail.com`,
          name:userName,
          password: userPassword,
          salt,
          verified: true,
          facebookId: id,
          image: photos[0].value,
          faceBookToken: accessToken,
          gender,
          userType: "Student",
          rating:0,
          areaOfInterest:["Chemistry"]
        })) as unknown as UserAttributes;

        const token: any = (await GenerateSignature({
          email: newUser.email,
          verified:newUser.verified,
          id: newUser.id
        })) as unknown as UserPayload;
        console.log(token);
        

        return res.redirect(
          `${process.env.CLIENT_URL}/auth/social/?token=${token}`
        );
      } else {
        //update the exp aand logedIn
        //update the logged in property
        // (await UserInstance.update(
        //   {
        //     isLoggedIn: true,
        //   },

        //   {
        //     where: {
        //       facebookId: id,
        //     },
        //     returning: true,
        //   }
        // )) as unknown as UserPayload | UserAttributes | any;

        const loggedinUser = (await UserInstance.findOne({
          where: {
            facebookId: id,
          },
        })) as unknown as UserAttributes;
        console.log(loggedinUser);
        

        const UserPayload: any = {
          email: loggedinUser.email,
          verified:loggedinUser.verified,
          id: loggedinUser.id
        } as unknown as UserPayload;

         const token = await GenerateSignature(UserPayload);
        console.log(token);
        
        return res.redirect(
          `${process.env.CLIENT_URL}/auth/social/?token=${token}`
        );
      }
    } catch (error) {
      console.log(error);
      return res.redirect(
        `${process.env.CLIENT_URL}/auth/social/?token=error`
      );
    }
  });
};
