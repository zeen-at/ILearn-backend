import Joi from "joi";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthPayload } from "../interface/auth.dto";
import { APP_SECRET } from "../Config";

/**
 * @openapi
 * components:
 *  schemas:
 *    CreateUserInput:
 *       type:  object
 *       required:
 *        - email
 *        - name
 *        - password
 *        - userType
 *        - areaOfInterest
 *       properties:
 *         email:
 *           type: string
 *           default: john.doe@example.com
 *         name:
 *           type: string
 *           default: john doe
 *         password:
 *           type: string
 *           default: stringpassword123
 *         userType:
 *           type: string
 *           default: Student
 *         areaOfInterest:
 *           type: string
 *           default: mathematics
 *    CreateUserResponse:
 *       type:  object
 *       properties:
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         userType:
 *           type: string
 *         areaOfInterest:
 *           type: string
 *         signature:
 *           type: string
 */
export const registerSchema = Joi.object().keys({
  email: Joi.string().required(),
  name: Joi.string().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
  userType: Joi.string().required(),
  areaOfInterest: Joi.array().required(),
  // confirm_password: Joi.any()
  //   .equal(Joi.ref("password"))
  //   .required()
  //   .label("Confirm password")
  //   .messages({ "any.only": "{{#label}} does not match" }),
});

/**
 * @openapi
 * components:
 *  schemas:
 *    EditUserProfile:
 *       type:  object
 *       required:
 *        - email
 *        - name
 *        - areaOfInterest
 *       properties:
 *         email:
 *           type: string
 *           default: john.doe@example.com
 *         name:
 *           type: string
 *           default: John Doe
 *         areaOfInterest:
 *           type: string
 *           default: mathematics
 *    EditUserResponse:
 *       type:  object
 *       properties:
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         areaOfInterst:
 *           type: string
 */
export const editprofileSchema = Joi.object().keys({
  email: Joi.string(),
  name: Joi.string(),
  areaOfInterest: Joi.array().items(Joi.string()).allow(""),
  image: Joi.string().allow(""),
});

/**
 * @openapi
 * components:
 *  schemas:
 *    LoginUserInput:
 *       type:  object
 *       required:
 *        - email
 *        - password
 *       properties:
 *         email:
 *           type: string
 *           default: oluwaseyimakinde64@gmail.com
 *         password:
 *           type: string
 *           default: 1234567890
 *    LoginUserResponse:
 *       type:  object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 */
export const loginSchema = Joi.object().keys({
  email: Joi.string().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
});

export const option = {
  abortEarly:
    false /* means if there's an error in the first keys, it'll takecare of the error 
                              first before moving on to the next error  */,
  errors: {
    wrap: { label: "" },
  },
};

export const GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

export const GeneratePassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};

export const GenerateSignature = async (payload: AuthPayload) => {
  try {
    return jwt.sign(payload, APP_SECRET, { expiresIn: "1d" });
  } catch (error) {
    throw "could not create a token";
  } /*1d means 1 day */
};

export const verifySignature = async (signature: string) => {
  return jwt.verify(signature, APP_SECRET) as JwtPayload;
};

export const validatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await GeneratePassword(enteredPassword, salt)) === savedPassword;
};

//======schema for reset Password=============//
/**
 * @openapi
 * components:
 *  schemas:
 *    ForgetPasswordInput:
 *       type:  object
 *       required:
 *        - email
 *       properties:
 *         email:
 *           type: string
 *           default: john.doe@example.com
 *    LoginUserResponse:
 *       type:  object
 *       properties:
 *         email:
 *           type: string
 *         signature:
 *           type: string
 */
export const forgotPasswordSchema = Joi.object().keys({
  email: Joi.string().required(),
});
export const resetPasswordSchema = Joi.object().keys({
  password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  //.pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  confirm_password: Joi.any()
    .equal(Joi.ref("password"))
    .required()
    .label("Confirm password")
    .messages({
      "any.only": "passwords does not match",
      "any.required": "You need to add a confirm password",
    }),
});

export const updateTutorSchema = Joi.object().keys({
  name: Joi.string().required(),
  about: Joi.string().allow(""),
  expertise: Joi.array().items(Joi.string()).allow(""),
  location: Joi.string().allow(""),
  status: Joi.string().allow(""),
  image: Joi.string().allow(""),
});
// validate schema for creating of reminders

/**
 * @openapi
 * components:
 *  schemas:
 *    CreateReminderInput:
 *       type:  object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *    CreateReminderResponse:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 */
export const validateReminder = (input: {}) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(3)
      .required()
      .messages({ "any.required": "A title is required" }),

    description: Joi.string().min(30).required().messages({
      "any.only": "Description should not be more than 30 characters",
      "any.required": "You need to add a description",
    }),
    startTime: Joi.string().isoDate().required().messages({
      "any.required": "You need to add a start time",
      "any.isoDate": "Start time should be an ISO Date",
    }),

    endTime: Joi.string().isoDate().required().messages({
      "any.required": "You need to add an End time",
      "any.isoDate": "End time should be an ISO Date",
    }),
  });
  return schema.validate(input);
};

//schema for rating course
export const ratingCourseSchema = Joi.object().keys({
  // courseId: Joi.string().required(),
  description: Joi.string().required(),
  ratingValue: Joi.number().required(),
});

//========schema for create_course===========

/**
 * @openapi
 * components:
 *  schemas:
 *    CourseInput:
 *       type:  object
 *       required:
 *        - title
 *        - description
 *        - price
 *        - category
 *        - image
 *        - video
 *        - file
 *       properties:
 *         title:
 *           type: string
 *           default: graphic design
 *         description:
 *           type: string
 *           default: master graphic design in one week
 *         price:
 *           type: string
 *           default: 7000
 *         category:
 *           type: string
 *           default: graphic design
 *         image:
 *           type: string
 *           format: binary
 *         video:
 *           type: string
 *           format: binary
 *         file:
 *           type: string
 *           format: binary
 *    CreateUserResponse:
 *       type:  object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: string
 *         category:
 *           type: string
 *         image:
 *           type: string
 *         video:
 *           type: string
 *         file:
 *           type: string
 */
export const createCourseSchema = Joi.object().keys({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  category: Joi.string().required(),
  image: Joi.string().required(),
  video: Joi.string().required(),
  file: Joi.string().required(),
});
