import express from "express";
import {
  createReminder,
  forgotPassword,
  getAllUsers,
  getRecommendedCourses,
  Login,
  Register,
  resetPasswordGet,
  resetPasswordPost,
  getTutorDetails,
  getAllTutors,
  tutorRating,
  verifyUser,
  getUserNotifications,
  readNotification,
  getTutorAvailabilities,
  getUserProfile,
  updateProfile,
  createAvailability,
  getStudentCourses,
  updateCourseProgress,
  getTutorCourses,
  rateTutor,
  getTutorReviews,
  createPaidCourse,
  getPaidCourse,
  getStudentCourse,
  googleLogin,
  bookTutor,
  getTutorBookings,
} from "../controller/userController";
import { protect, verifyPayment } from "../Middlewares/authMiddleware";
import { upload } from "../utils/multer";

const router = express.Router();
/**
 * @openapi
 * '/users/signup':
 *  post:
 *    tags:
 *      - Auth
 *    summary: Register a user
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *    responses:
 *       201:
 *         description: you have sucessfully registered a user, check your email
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CreateUserResponse'
 *       500:
 *         description: internal server error
 *
 */
router.post("/signup", Register);

/**
 * @openapi
 * '/users/login':
 *  post:
 *    tags:
 *      - Auth
 *    summary: Login a user
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserInput'
 *    responses:
 *       201:
 *         description: you have sucessfully logged in
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/LoginUserResponse'
 *       500:
 *         description: internal server error
 *
 */
router.post("/login", Login);

/**
 * @openapi
 * /users/verify/{signature}:
 *   get:
 *      tags: [Auth]
 *      description: verify user
 *      parameters:
 *       - name: signature
 *         in: path
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: Returns verified true.
 */
router.get("/verify/:signature", verifyUser);

/**
 * @openapi
 * /users:
 *   get:
 *      tags: [Users]
 *      description: get all users..
 *      responses:
 *        200:
 *          description: Returns an array of users.
 */
router.get("/", getAllUsers);

/**
 * @openapi
 * /users/profile:
 *   get:
 *      tags: [Users]
 *      security:
 *       - Authorization: []
 *      description: get users profile
 *      responses:
 *        200:
 *          description: Returns users profile.
 */
router.get("/profile", protect, getUserProfile);

/**
 * @openapi
 * /users/atutordetail/{tutorid}:
 *   get:
 *      tags: [Users]
 *      security:
 *       - Authorization: []
 *      description: get a tutors details
 *      parameters:
 *       - name: tutorid
 *         in: path
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: Returns user profile.
 */
router.get("/atutordetail/:tutorid", protect, getTutorDetails);
router.get("/googleLogin", googleLogin);

/**
 * @openapi
 *  /courses/rate-courses/{id}/rate:
 *   post:
 *     tags: [Users]
 *     summary: Rate a tutor
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 studentId:
 *                   type: string
 *                 description:
 *                   type: string
 *                 rating:
 *                   type: integer
 *                 tutorId:
 *                   type: string
 *     responses:
 *       200:
 *         description: you have successfully rated the course
 *       500:
 *         error adding rating
 */
router.post("/tutors/:id/rate", protect, rateTutor);

/**
 * @openapi
 * /users/tutors/{id}/review:
 *   get:
 *      tags: [Users]
 *      description: get tutor review
 *      parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: Returns user profile.
 */
router.get("/tutors/:id/review", getTutorReviews); //if any conflict, inquire the id to be used

/**
 * @openapi
 * '/users/updatetutorprofile':
 *  put:
 *    tags:
 *      - Users
 *    security:
 *       - Authorization: []
 *    summary: Update a tutor profile
 *    requestBody:
 *       content:
 *         multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              totalCourses:
 *                type: string
 *              areaOfInterest:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *    responses:
 *       201:
 *         description: you have sucessfully updated your course
 *         content:
 *           application/json:
 *              schema:
 *       type:  object
 *       properties:
 *         name:
 *           type: string
 *         totalCourses:
 *           type: string
 *         areaOfInterest:
 *           type: string
 *         image:
 *           type: string
 *       500:
 *         description: internal server error
 *
 */

/**
 * @openapi
 *  /users/forgot-password:
 *   post:
 *     tags: [Users]
 *     summary: Forget Password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                 email:
 *                   type: string
 *     responses:
 *       200:
 *         description: password reset link sent to email
 *       500:
 *         description: unable to reset password
 */
router.post("/forgot-password", forgotPassword);
router.get("/resetpassword/:id/:token", resetPasswordGet);
router.post("/resetpassword/:id/:token", resetPasswordPost);

/**
 * @openapi
 * '/users/reminders':
 *  post:
 *    tags:
 *      - Users
 *    security:
 *       - Authorization: []
 *    summary: create a reminder for a user
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReminderInput'
 *    responses:
 *       201:
 *         description: you have sucessfully registered a user, check your email
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CreateReminderResponse'
 *       500:
 *         description: internal server error
 *
 */
router.post("/reminders", protect, createReminder);

/**
 * @openapi
 * /users/all-tutors:
 *   get:
 *      tags: [Users]
 *      description: Display all tutor
 *      responses:
 *        200:
 *          description: Returns all tutors.
 */
router.get("/all-tutors", getAllTutors);

/**
 * @openapi
 * /users/feature-tutors:
 *   get:
 *      tags: [Users]
 *      description: Display tutor ratings for students
 *      responses:
 *        200:
 *          description: Returns user profile.
 */
router.get("/feature-tutors", tutorRating);
//router.post("/request", protect, requestTutor);

/**
 * @openapi
 * /users/recommended/{category}:
 *   get:
 *      tags: [Users]
 *      security:
 *       - Authorization: []
 *      description: recommend a course
 *      parameters:
 *       - name: category
 *         in: query
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: Returns user profile.
 */
router.get("/recommended/:category", protect, getRecommendedCourses);

/**
 * @openapi
 * /users/notifications:
 *   get:
 *      tags: [Users]
 *      security:
 *       - Authorization: []
 *      description: get Users notifications
 *      responses:
 *        200:
 *          description: Returns user profile.
 */
router.get("/notifications", protect, getUserNotifications);

/**
 * @openapi
 * '/notifications/{id}':
 *  put:
 *    tags:
 *      - Users
 *    security:
 *       - Authorization: []
 *    summary: read/get single notifications**
 *    requestBody:
 *       content:
 *         application/json:
 *          schema:
 *    responses:
 *       201:
 *        sucessfull read notificcation
 */
router.put("/notifications/:id", protect, readNotification); //this may be a get request, confirm !!!

/**
 * @openapi
 * '/users/edit-profile/{signature}':
 *  put:
 *    tags:
 *      - Users
 *    security:
 *       - Authorization: []
 *    summary: Update student profile
 *    requestBody:
 *       content:
 *         multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              email:
 *                type: string
 *              areaOfInterest:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *    responses:
 *       201:
 *         description: user updated successfully
 *         content:
 *           application/json:
 *              schema:
 *       type:  object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         areaOfInterest:
 *           type: string
 *         image:
 *           type: string
 *       500:
 *         description: internal server error
 *
 */

router.put("/edit-profile", upload.single("image"), protect, updateProfile);

/**
 * @openapi
 * '/users/tutor/availability':
 *   post:
 *    tags: [Users]
 *    security:
 *       - Authorization: []
 *    summary: create a reminder for a user
 *    requestBody:
 *      content:
 *        application/json:
 *           schema:
 *             type:  object
 *             properties:
 *               availableTime:
 *                 type: string
 *               availableDate:
 *                 type: string
 *               dateToIso:
 *                 type: string
 *               userId:
 *                 type: string
 *               vailableSlots:
 *                 type: stringstring
 *               availableTime.length:
 *                 type: string
 *    responses:
 *       201:
 *         description: You have already created availability for this date
 *         content:
 *           application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  areaOfInterest:
 *                    type: string
 *       500:
 *         description: internal server error
 *
 */
router.post("/tutors/availablity", protect, createAvailability);

// student course route
router
  .route("/students/courses")
  .get(protect, getStudentCourses)
  .post(protect, createPaidCourse)
  .patch(protect, updateCourseProgress);

router.get("/students/courses/:id", protect, getStudentCourse);

router.get("/get-available-tutors/:tutorId", protect, getTutorAvailabilities);

/**
 * @openapi
 * /users/tutors/{id}/course:
 *   get:
 *      tags: [Users]
 *      security:
 *       - Authorization: []
 *      description: get tutor courses by ID
 *      parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: Returns tutor courses.
 */
router.get("/tutors/:id/course", protect, getTutorCourses);
router.post("/book-session", protect, bookTutor);

router.get("/student/courses/:courseId", protect, getPaidCourse);

router.post("/payments/:reference", protect, verifyPayment, createPaidCourse);
router.get("/tutors/bookings", protect, getTutorBookings);

export default router;
