import { Request, Response, NextFunction, request } from "express";
import { UserAttributes, UserInstance } from "../model/userModel";
import { AvailabilityInstance } from "../model/availabilityModel";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import admin from "../Config/firebase";
import "../utils/passport";
import {
  forgotPasswordSchema,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  loginSchema,
  option,
  registerSchema,
  resetPasswordSchema,
  updateTutorSchema,
  editprofileSchema,
  validatePassword,
  verifySignature,
  validateReminder,
} from "../utils/utility";
import {
  createNotification,
  emailHtml2,
  emailHtml3,
  mailSent,
  mailSent2,
} from "../utils/notification";
import { APP_SECRET, FromAdminMail, userSubject } from "../Config";

import { ReminderInstance } from "../model/reminderModel";
import { courseInstance } from "../model/courseModel";
import { Op, ValidationError } from "sequelize";
import { NotificationInstance } from "../model/notificationModel";
import moment from "moment";
import { TutorRatingInstance } from "../model/tutorRatingModel";
import { tutorRequestInstance } from "../model/bookSession";
import { AreaOfInterestInstance } from "../model/areaOfInterestModel";
import { StudentCoursesInstance } from "../model/users/students/studentCoursesModel";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserInstance.findAll({
      attributes: { exclude: ["password", "salt"] },
    });
    // console.log(req.user && req.user.toJSON());

    res.status(200).json(users);
  } catch (error) {
    res.status(401).send("An error occurred");
  }
};

/**===================================== Register User ===================================== **/
const Register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, areaOfInterest, userType } = req.body;
    const uuiduser = uuidv4();
    //console.log(req.body)
    const validateResult = registerSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    //Generate salt
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    //check if the user exists
    const User = await UserInstance.findOne({ where: { email: email } });

    // await mailSent("Ilearn App", email, "Ilearn User Verification", html);
    if (User) {
      return res.status(400).json({
        Error: "User already exist!",
      });
    }
    //Create User
    let createdUser;

    if (!User) {
      createdUser = await UserInstance.create({
        id: uuiduser,
        email,
        password: userPassword,
        name,
        areaOfInterest,
        userType,
        verified: false,
        salt,
        image: "",
      });

      if (!createdUser) {
        return res.status(500).send({ Error: "unable to create user" });
      }

      let signature = await GenerateSignature({
        id: createdUser.id,
        email: createdUser.email,
        verified: createdUser.verified,
      });
      // console.log(process.env.fromAdminMail, email, userSubject);

      //send Email to user
      const link = `Press <a href=${process.env.BASE_URL}/users/verify/${signature}> here </a> to verify your account. Thanks.`;
      const html = emailHtml3(link);
      await mailSent(
        process.env.fromAdminMail!,
        email,
        "Ilearn User Verification",
        html
      );

      //check if user exist

      return res.status(201).json({
        message:
          "You have registered successfully, Check your email for verification",
      });
    }
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/signup",
      err,
    });
  }
};

/**==================== Verify Users ========================**/
export const verifyUser = async (req: JwtPayload, res: Response) => {
  try {
    const token = req.params.signature;
    // Verify the signature
    const { id, email, verified } = await verifySignature(token);
    // Find the user with the matching verification token
    const user = await UserInstance.findOne({ where: { id } });
    if (!user) {
      throw new Error("Invalid verification token");
    }

    // Set the user's verified status to true
    const User = await UserInstance.update(
      {
        verified: true,
      },
      { where: { id } }
    );

    await user.save();

    // Redirect the user to the login page
    return res.redirect(301, `${process.env.CLIENT_URL}/login`);

    // res
    //   .status(200)
    //   .send({
    //     message: "user has been verified successfully",
    //     success: true,
    //   })
    //   .redirect(`${process.env.CLIENT_URL}/login`);

    // Send a success response to the client

    // return res.status(201).json({ message: 'Your email has been verified.' });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/verify",
    });
  }
};

/**==================== Login User ========================**/
const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);
    console.log("bug");
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    //check if the user exist
    const User = await UserInstance.findOne({
      where: { email: email },
    });

    if (!User) {
      return res.status(400).json({
        Error: "Wrong Username or password",
      });
    }

    if (User.verified) {
      const validation = await validatePassword(
        password,
        User.password,
        User.salt
      );
      if (validation) {
        //Regenerate a signature
        let signature = await GenerateSignature({
          id: User.id,
          email: User.email,
          verified: User.verified,
        });

        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: User.email,
          verified: User.verified,
          userType: User.userType,
        });
      }
      return res.status(400).json({
        Error: "Wrong Username or password",
      });
    }
    return res.status(400).json({
      Error: "you have not been verified",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/login",
      err,
    });
  }
};

/**=========================== Resend Password ============================== **/
// febic69835@bitvoo.com

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const validateResult = forgotPasswordSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    //check if the User exist
    const oldUser = await UserInstance.findOne({
      where: { email: email },
    });

    //console.log(oldUser);
    if (!oldUser) {
      return res.status(400).json({
        message: "user not found",
      });
    }
    const secret = APP_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser.id }, secret, {
      expiresIn: "1d",
    });
    const link = `${process.env.CLIENT_URL}/users/resetpassword/?userId=${oldUser.id}&token=${token}`;
    if (oldUser) {
      const html = emailHtml2(link);
      await mailSent2(
        FromAdminMail,
        oldUser.email,
        "Reset your password",
        html
      );
      return res.status(200).json({
        message: "password reset link sent to email",
        link,
      });
    }
    //console.log(link);
  } catch (error) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/forgot-password",
    });
  }
};

//On clicking the email link ,

const resetPasswordGet = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const oldUser = await UserInstance.findOne({
    where: { id: id },
  });
  if (!oldUser) {
    return res.status(400).json({
      message: "User Does Not Exist",
    });
  }
  const secret = APP_SECRET + oldUser.password;
  console.log(secret);
  try {
    const verify = jwt.verify(token, secret);
    return res.status(200).json({
      email: oldUser.email,
      verify,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/resetpassword/:id/:token",
    });
  }
};

// Page for filling the new password and confirm password

const resetPasswordPost = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const { password } = req.body;
  console.log(req.body);

  const validateResult = resetPasswordSchema.validate(req.body, option);
  if (validateResult.error) {
    return res.status(400).json({
      Error: validateResult.error.details[0].message,
    });
  }
  const oldUser = await UserInstance.findOne({
    where: { id: id },
  });
  if (!oldUser) {
    return res.status(400).json({
      message: "user does not exist",
    });
  }
  const secret = APP_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, oldUser.salt);
    const updatedPassword = (await UserInstance.update(
      {
        password: encryptedPassword,
      },
      { where: { id: id } }
    )) as unknown as UserAttributes;
    return res.status(200).json({
      message: "you have succesfully changed your password",
      updatedPassword,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/resetpassword/:id/:token",
    });
  }
};

/**=========================== Create a new Reminders============================== **/
const createReminder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, startTime, endTime } = req.body;
    const { error } = validateReminder(req.body);

    if (error) return res.status(400).send({ Error: error.details[0].message });

    const startDate: Date = new Date(startTime);

    // calculate current date time that is one hour behind
    const currentDate =
      new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000;

    // check if the time is not in the past
    if (startDate.getTime() < currentDate) {
      res.status(405).send({
        Error: "Please choose a more current time",
      });
      return;
    }
    // create the reminder
    await ReminderInstance.create({
      title,
      description,
      startTime,
      endTime,
      userId,
    });
    res.status(200).send({
      message: "Reminder created sucessfully",
    });
  } catch (error) {
    res.status(500).json({
      Error: error,
    });
  }
};

// /**=========================== Google Login ============================== **/

const googleLogin = async (req: Request, res: Response) => {
  console.log("thos");
  if (!req.headers.authorization) {
    return res.status(500).send({ message: "Invalid token" });
  }
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (!decodeValue) {
      return res.status(505).json({ message: "Unauthorized" });
    } else {
      //
      const userExists = await UserInstance.findOne({
        where: { email: decodeValue.email },
      });
      console.log(userExists);

      if (!userExists) {
        const salt = await GenerateSalt();
        const newUser = await UserInstance.create({
          name: decodeValue?.name,
          email: decodeValue?.email,
          image: decodeValue?.picture,
          verified: decodeValue?.email_verified,
          userType: "Student",
          password: await GeneratePassword(
            Math.floor(Math.random() * 10000) + "",
            salt
          ),
          salt: "the quick brown fox jump over the lazy dog",
        });

        let signature = await GenerateSignature({
          id: newUser.id,
          email: newUser.email,
          verified: newUser.verified,
        });
        res.status(200).json({
          message: "user created successfully",
          user: newUser,
          signature,
        });
      } else {
        try {
          let result = await UserInstance.findOne({
            where: { email: decodeValue.email },
          });
          console.log(result);
          result?.update({ createdAt: decodeValue.createdAt });

          if (!result) {
            return res
              .status(400)
              .json({ message: "user could not be updated" });
          }
          let signature = await GenerateSignature({
            id: result.id,
            email: result.email,
            verified: result.verified,
          });
          res.status(200).json({
            message: "user logged in successfully",
            signature,
            user: result,
          });
        } catch (error) {
          res.status(400).json({ message: "Error updating user", error });
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

/**=========================== Get all Reminders============================== **/

const getAllReminders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reminders = await ReminderInstance.findAll({ where: { id: userId } });
    return res.status(200).json({
      message: "You have successfully retrieved all reminders",
      reminders: reminders,
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-all-reminders",
    });
  }
};

/**==================== Get all recmmended courses================**/
const getRecommendedCourses = async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    // const id = req.user?.id

    const recommendedCourse = await courseInstance.findAll({
      where: { category, rating: { [Op.gt]: 0 } },
      attributes: [
        "id",
        "title",
        "course_image",
        "rating",
        "pricing",
        "description",
        "category",
      ],
      include: ["tutor"],
      order: [["rating", "DESC"]],
      limit: 10,
    });
    if (!recommendedCourse) {
      return res.status(400).json({ message: "No recommended courses found" });
    }
    res.status(200).json({
      message: "Recommended courses found",
      recommendedCourse,
    });
  } catch (error: any) {
    res.status(500).json({ Error: error.message });
  }
};
/**=========================== get Tutor Details ============================== **/

export const getTutorDetails = async (req: Request, res: Response) => {
  try {
    const tutorId = req.params.tutorid;

    const tutorDetails = await UserInstance.findOne({ where: { id: tutorId } });
    if (tutorDetails !== null) {
      return res.status(200).json({
        message: tutorDetails,
      });
    }
    return res.status(400).json({
      Error: "Tutor does not exist",
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      route: "/vendor/update-profile",
    });
  }
};
// /**=========================== get User Profile ============================== **/

const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.user!;

    const userDetails = await UserInstance.findOne({
      where: { id, verified: true },
      attributes: { exclude: ["salt", "password"] },
      include: ["courses"],
      order: [["createdAt", "DESC"]],
    });
    if (!userDetails) {
      return res.status(400).json({
        Error: "You are not a valid user",
      });
    }

    return res.status(200).json({
      message: "user found",
      userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      Error: error,
      route: "/users/profile",
      error,
    });
  }
};

//==========================All Tutor====================

const getAllTutors = async (req: Request, res: Response) => {
  try {
    const { query, page, limit } = req.query as {
      query?: string;
      page?: string;
      limit?: string;
    };
    const currentPage = page ? parseInt(page) : 1;
    const limitPerPage = limit ? parseInt(limit) : 20;
    const offset = (currentPage - 1) * limitPerPage;

    let queryPage;
    if (query) {
      queryPage = {
        userType: "Tutor",
        [Op.or]: [
          { name: { [Op.like]: `${query}` } },
          { name: { [Op.substring]: `${query}` } },
          { email: { [Op.substring]: `${query}` } },
          { email: { [Op.like]: `${query}` } },
        ],
      };
    } else {
      queryPage = { userType: "Tutor" };
    }
    // Find the tutors in the database
    const findTutor = await UserInstance.findAndCountAll({
      where: queryPage,
      attributes: ["id", "email", "name", "rating", "image"],
      limit: limitPerPage,
      offset,
    });
    // Calculate the total number of pages
    const totalPages = Math.ceil(findTutor.count / limitPerPage);
    // Return the results in a JSON response
    return res.status(200).json({
      TutorNumber: findTutor.count,
      findTutor: findTutor.rows,
      totalPages,
      currentPage,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error: All Tutor",
      error,
    });
  }
};

// =============================Tutor Rating==============================
const tutorRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let page: any = req.query.page;
    let limit: any = req.query.limit;

    const offset = page ? page * limit : 0;

    const tutorSorted = await UserInstance.findAll({
      where: { userType: "Tutor", rating: { [Op.gt]: 0 } },
      attributes: ["id", "email", "name", "image", "rating"],
      order: [["rating", "DESC"]],
      limit: limit,
      offset: offset,
    });
    return res.status(200).json({
      TutorNumber: tutorSorted.length,
      tutorSorted,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error: Tutor-Rating",
      error,
    });
  }
};

/**=========================== get User Notifications ============================== **/

const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const notifications = await NotificationInstance.findAll({
      where: {
        receiver: id,
      },
      include: [
        { model: courseInstance, as: "course", attributes: ["title"] },
        { model: UserInstance, as: "theSender", attributes: ["name", "image"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res
      .status(200)
      .json({ message: "notification fetched successfully", notifications });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error /users/getNotifications",
      error,
    });
  }
};

const readNotification = async (req: Request, res: Response) => {
  try {
    const id = req.params?.id;

    const notification = await NotificationInstance.findOne({
      where: {
        id,
      },
    });
    if (!notification) {
      return res.status(400).json({
        message: "Notification does not exist",
      });
    }
    notification.status = "read";
    const result = await notification.save();
    return res.status(200).json({
      message: "Notification has been read",
      notification: result,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error /users/readNotification",
      error,
    });
  }
};

/**=========================== create tutor rating ============================== **/

const rateTutor = async (req: Request, res: Response) => {
  const { id } = req.user!;

  try {
    const { description, ratingValue } = req.body;

    // check if the student and tutor exist in the database

    const student = await UserInstance.findOne({ where: { id } });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const tutor = await UserInstance.findOne({ where: { id: req.params.id } });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // check to ensure only students can rate tutor
    if (student && student.userType !== "Student") {
      return res.status(403).json({ message: "Only students can rate tutors" });
    }

    const alreadyRated = await TutorRatingInstance.findOne({
      where: { studentId: id, tutorId: req.params.id },
    });

    if (alreadyRated) {
      return res
        .status(401)
        .json({ message: "This tutor has been rated by you." });
    }

    const newTutorRatingDetails = await TutorRatingInstance.create({
      studentId: id,
      description,
      ratingValue,
      tutorId: req.params.id,
    });

    const tutorRatings = await TutorRatingInstance.findAll({
      where: { tutorId: req.params.id },
    });
    const tutorTotalRating = tutorRatings.reduce((acc, curr) => {
      return acc + curr.ratingValue;
    }, 0);
    const tutorAverageRating = tutorTotalRating / tutorRatings.length;

    await UserInstance.update(
      { rating: tutorAverageRating },
      { where: { id: req.params.id } }
    );

    res.status(200).json({
      message: "Rating added successfully",
      data: {
        ratingValue: newTutorRatingDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      mesage: "error adding rating",
      error,
    });
  }
};

/**===================================== Tutor review details ===================================== **/

const getTutorReviews = async (req: Request, res: Response) => {
  const tutorId = req.params.id;
  try {
    const tutorReviewInfo = await TutorRatingInstance.findAll({
      where: {
        tutorId: tutorId,
      },
      include: [
        {
          model: UserInstance,
          as: "student",
          attributes: ["name", "image"],
        },
      ],
    });
    if (!tutorReviewInfo) {
      return res.status(404).json({
        message: "you have no review",
      });
    }
    return res.status(200).json({
      tutorReviewInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not fetch tutor review details at this time",
      error,
    });
  }
};

const createAvailability = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ Error: "User not found" });
    }
    const { id } = req.user;
    const { availableDate, availableTime } = req.body;

    // Verify that the user exists
    const user = await UserInstance.findOne({ where: { id: id } });
    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    // use moment.js to validate date
    const date = moment(availableDate, "YYYY-MM-DD");
    if (!date.isValid()) {
      return res.status(400).json({
        Error: "Invalid date format, please use format YYYY-MM-DD",
      });
    }

    const dateToIso = date.toISOString();

    // CHECK IF THE USER HAS ALREADY CREATED AVAILABILITY
    const availabilityExists = await AvailabilityInstance.findOne({
      where: {
        availableDate: dateToIso,
      },
    });

    if (availabilityExists) {
      return res.status(400).json({
        Error:
          "You have already created availability for this date, please edit your availability instead",
      });
    }

    // create the user's availability
    const availability = await AvailabilityInstance.create({
      availableTime,
      availableDate: dateToIso,
      userId: id,
      availableSlots: availableTime.length,
      selectedTime: availableTime,
    });

    // Return a success response
    return res.status(200).json({
      message: "Availability created successfully",
      availability,
    });
  } catch (err) {
    console.error(err);
    if ((err as ValidationError).name === "ValidationError") {
      return res.status(400).json({
        Error: (err as ValidationError).errors[0].message,
      });
    }
    return res.status(500).json({
      Error: "Internal server error",
      route: "/users/tutors/availability",
    });
  }
};

// const getStudentCourse = async (req: Request, res: Response) => {
//   try {
//     const { id }: { id: string } = req.user;

//     const courses = await StudentCoursesInstance.findOne({
//       where: { studentId: id },
//       include: [
//         {
//           model: courseInstance,
//           as: "course",
//           attributes: ["title", "course_image"],
//         },
//         { model: UserInstance, as: "tutor", attributes: ["name"] },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     if (!courses) {
//       return res.status(404).json({
//         message: "you currently have no courses",
//       });
//     }

//     res.status(200).json({
//       message: "course fetched successfully",
//       courses,
//     });
//   } catch (error) {
//     res.status(500).json({
//       Error: "Internal server error",
//       message: error,
//     });
//   }
// };

const getStudentCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const courseDetails = await StudentCoursesInstance.findOne({
      where: { courseId: id },
      include: [
        {
          model: courseInstance,
          as: "course",
          attributes: ["title", "course_image", "course_material"],
        },
      ],
    });
    // where: { studentId: id },

    //     { model: UserInstance, as: "tutor", attributes: ["name"] },
    //   ],
    //   order: [["createdAt", "DESC"]],
    // });

    if (!courseDetails) {
      return res.status(404).json({
        message: "you currently have no course",
      });
    }

    res.status(200).json({
      message: "course fetched successfully",
      courseDetails,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      message: error,
    });
  }
};

const getStudentCourses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ Error: "Route need to be proctected" });
    }
    const { id }: { id: string } = req.user;

    const courses = await StudentCoursesInstance.findAll({
      where: { studentId: id },
      include: [
        {
          model: courseInstance,
          as: "course",
          attributes: ["title", "course_image"],
        },
        { model: UserInstance, as: "tutor", attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!courses) {
      return res.status(404).json({
        message: "you currently have no courses",
      });
    }

    res.status(200).json({
      message: "course fetched successfully",
      courses,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      message: error,
    });
  }
};

const getPaidCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ Error: "Route need to be proctected" });
    }
    const { id } = req.user;
    const { courseId } = req.params;

    const courseExist = await StudentCoursesInstance.findOne({
      where: { courseId, studentId: id },
    });

    if (!courseExist) {
      return res.status(404).json({
        message: "This is not a valid course",
      });
    }

    res.status(200).json({
      message: "course found",
      course: courseExist,
    });
  } catch (error) {
    console.log(error);
  }
};
// test student create course
// looks like this should be created when a user make a payment.
const createPaidCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ Error: "Route need to be proctected" });
    }

    const { id } = req.user;
    const { courseId } = req.body;

    console.log(courseId, id);

    const validCourse = await courseInstance.findOne({
      where: { id: courseId },
    });

    if (!validCourse) {
      return res.status(404).json({
        message: "This is not a valid course",
      });
    }

    const courseExist = await StudentCoursesInstance.findOne({
      where: { courseId, studentId: id },
    });

    if (courseExist) {
      return res.status(404).json({
        message: "you Already have this course",
      });
    }
    await StudentCoursesInstance.create({
      courseId,
      studentId: id,
      tutorId: validCourse.tutorId,
    });
    createNotification(
      "payment",
      validCourse.tutorId,
      "ordered your course",
      id,
      courseId
    );

    res.status(201).json({
      message: "course added successfully",
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      message: error,
    });
  }
};

const updateCourseProgress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ Error: "Route need to be proctected" });
    }
    const { id } = req.user;
    const { courseId, currentPage, totalPages } = req.body;
    const course = await StudentCoursesInstance.findOne({
      where: { courseId, studentId: id },
    });

    if (!course) {
      return res.status(404).json({
        message: "This is not a valid course",
      });
    }

    if (currentPage > totalPages || currentPage < 1) {
      return res.status(401).json({
        message: "could not update, this is not a valid currentpage",
      });
    }
    const progress = Math.floor((currentPage / totalPages) * 100);

    if (currentPage <= course.currentPage) {
      return res.status(200).json({
        message: "progress does not need an update",
      });
    }

    course.currentPage = currentPage;
    course.progress = progress;
    await course.save();

    res.status(200).json({
      message: "progress updated successfully",
      progress,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      message: error,
    });
  }
};
const getTutorAvailabilities = async (req: Request, res: Response) => {
  try {
    const tutorId = req.params.tutorId;

    const availabilities = await AvailabilityInstance.findAll({
      where: { userId: tutorId },
    });

    const availabilitiesWithSlots = availabilities.filter(
      (time) => time.availableTime.length > 0
    );
    res.json({ availabilities });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching availabilities" });
    throw error;
  }
};

const getTutorCourses = async (req: Request, res: Response) => {
  try {
    const tutorId = req.params.id;

    const courses = await courseInstance.findAll({
      where: { tutorId },
    });
    return res.status(200).json({
      message: "Courses fetched successfully",
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      error,
    });
  }
};

/**===================================== Edit-profile===================================== **/

const updateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const userType = req.user?.userType;

    if (userType === "Student") {
      // Use destructuring assignment to extract the properties from req.body
      const { name, email, image, areaOfInterest } = req.body;
      // Validate the request body using the updateStudentSchema
      const validateResult = editprofileSchema.validate(req.body);
      if (validateResult.error) {
        return res.status(400).json({
          Error: validateResult.error.details[0].message,
        });
      }
      // Find the student by id
      const student = await UserInstance.findOne({ where: { id } });
      if (!student) {
        return res.status(400).json({
          Error: "You are not authorized to update your profile",
        });
      }

      // Update the student's properties
      await student.update({
        image: req.file?.path,
        name,
        areaOfInterest,
        email,
      });

      // Save the changes to the database
      const updateStudent = await student.save();

      // Return a success response with the updated student
      return res.status(200).json({
        message: "You have successfully updated your account",
        student: {
          ...student.toJSON(),
          areaOfInterest,
        },
      });
    } else if (userType === "Tutor") {
      const { name, about, location, expertise } = req.body;
      const joiValidateTutor = updateTutorSchema.validate(req.body);
      if (joiValidateTutor.error) {
        return res.status(400).json({
          Error: joiValidateTutor.error.details[0].message,
        });
      }

      const tutor = await UserInstance.findOne({ where: { id } });
      if (tutor === null) {
        return res.status(400).json({
          Error: "You are not authorized to update your profile",
        });
      }

      await tutor.update({
        image: req.file?.path,
        name,
        about,
        location,
        expertise,
      });

      const updateTutor = await tutor.save();
      console.log("---------", updateTutor);
      if (updateTutor) {
        // const tutor = await UserInstance.findOne({ where: { id } });
        if (
          //updateTutor?.areaOfInterest.length > 0 &&
          updateTutor?.image !== null &&
          updateTutor?.rating !== null &&
          updateTutor?.about !== null &&
          updateTutor?.expertise.length > 0 &&
          updateTutor?.location !== null
        ) {
          await updateTutor?.update({
            status: true,
          });
          const updatedTutor = await updateTutor?.save();
          console.log(updatedTutor);

          return res.status(200).json({
            message: "You have successfully updated your account",
            updatedTutor,
          });
        } else {
          return res.status(200).json({
            message: "You have successfully updated your account",
            updateTutor,
          });
        }
      } else {
        return res.status(400).json({
          Error: "There's an error",
        });
      }
    } else {
      return res.status(400).json({
        Error: "Invalid user type",
      });
    }
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      error,
    });
  }
};

/**=====================================Scheduled Time for student===================================== **/

const bookTutor = async (req: Request, res: Response) => {
  try {
    const { availabilityId, pickedTime } = req.body;
    if (!req.user) {
      return res.status(404).json({ Error: "Route need to be proctected" });
    }
    const { id } = req.user;
    const tutorAvailability = await AvailabilityInstance.findOne({
      where: { id: availabilityId },
    });
    if (!tutorAvailability) {
      throw new Error("no tutor availability");
    }
    if (!tutorAvailability.availableTime.includes(pickedTime)) {
      return res.status(404).json({ message: "time is not available" });
    }
    const bookSession = await tutorRequestInstance.create({
      pickedTime,
      tutorId: tutorAvailability.userId,
      studentId: id,
      availabilityId,
    });
    const newAvailableTime = tutorAvailability.availableTime.filter(
      (time) => time !== pickedTime
    );

    tutorAvailability.update({
      availableTime: newAvailableTime,
      availableSlots: newAvailableTime.length,
    });

    tutorAvailability.save();

    const createNotification = await NotificationInstance.create({
      sender: id,
      receiver: tutorAvailability.userId,
      notificationType: "session",
      status: "unread",

      description: `A user has requested booked a session with you on ${bookSession.pickedTime}`,
    });
    res.status(201).send("session booked successfully");
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      error,
    });
  }
};
const getTutorBookings = async (req: Request, res: Response) => {
  const tutorId = req.user?.id;
  try {
    const bookings = await tutorRequestInstance.findAll({
      include: [
        {
          model: UserInstance,
          as: "student",
          attributes: ["name", "email", "image", "areaOfInterest"],
        },
        {
          model: AvailabilityInstance,
          as: "availableTime",
          attributes: ["availableTime", "availableDate"],
        },
      ],
      where: { tutorId },
    });
    if (!bookings) {
      return res.status(404).json({
        Error: "No bookings found",
      });
    }
    return res.status(200).json({
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      error,
    });
  }
};

/*******************************tutor booking notification************************ */

const tutorNotification = async (req: Request, res: Response) => {
  try {
    const { availabilityId, pickedTime } = req.body;
    if (!req.user) {
      return res.status(400).json({
        Error: "no user found",
      });
    }
    const { id } = req.user;
    const tutorAvailability = await AvailabilityInstance.findOne({
      where: { id: availabilityId },
    });
    if (!tutorAvailability) {
      throw new Error("no tutor availability");
    }
    if (!tutorAvailability.availableTime.includes(pickedTime)) {
      return res.status(404).json({ message: "time is not available" });
    }

    res.status(201).send("notification created successfully");
  } catch (err) {
    console.log(err);
    // throw new Error
    res.status(500).send(err);
  }
};

export {
  Login,
  Register,
  googleLogin,
  getAllUsers,
  forgotPassword,
  resetPasswordGet,
  resetPasswordPost,
  createReminder,
  getRecommendedCourses,
  getAllReminders,
  tutorRating,
  getAllTutors,
  getUserNotifications,
  readNotification,
  getTutorAvailabilities,
  getUserProfile,
  rateTutor,
  createAvailability,
  getStudentCourse,
  getStudentCourses,
  createPaidCourse,
  updateCourseProgress,
  getTutorCourses,
  getTutorReviews,
  getPaidCourse,
  updateProfile,
  bookTutor,
  getTutorBookings,
};
