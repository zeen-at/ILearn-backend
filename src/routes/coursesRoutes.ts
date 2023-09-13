import express from "express";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  updateCourse,
  addCourse,
  courseRequest,
  requestCourseById,
  getCourseById,
  rateCourses,
} from "../controller/courseController";
import { getAllUsers, Login, Register } from "../controller/userController";
import { protect } from "../Middlewares/authMiddleware";
import { getStudentHistory } from "../controller/courseController";
import { upload } from "../utils/multer";
const router = express.Router();

/**
 * @openapi
 * /courses:
 *  get:
 *      tags: [courses]
 *      description: get all courses
 *      parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         type: string
 *       - name: page
 *         in: query
 *         required: false
 *         type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         type: string
 *      responses:
 *        200:
 *          description: you have sucessfully retrieved all courses
 */
router.get("/", protect, getAllCourses);

/**
 * @openapi
 * /courses/get-course/{id}:
 *  get:
 *     tags: [courses]
 *     security:
 *       - Authorization: []
 *     description: Get a single course
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *        200:
 *          description: you have sucessfully retrieved a course
 *        404:
 *          description: course not found
 */
router.get("/get-course/:id", protect, getCourseById);

/**
 * @openapi
 * /courses/getStudentHistory:
 *  get:
 *      tags: [courses]
 *      description: get student course history
 *      security:
 *       - Authorization: []
 *      responses:
 *        200:
 *          description: you have sucessfully student course history
 */
router.get("/getStudentHistory", protect, getStudentHistory);

/**
 * @openapi
 * '/courses/createCourse':
 *  post:
 *    tags: [courses]
 *    summary: create a course
 *    security:
 *       - Authorization: []
 *    requestBody:
 *       content:
 *         multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *              description:
 *                type: string
 *              pricing:
 *                type: string
 *              category:
 *                type: string
 *              course_image:
 *                type: string
 *                format: binary
 *              course_material:
 *                type: string
 *                format: binary
 *    responses:
 *       201:
 *         description: you have sucessfully logged in
 *         content:
 *           application/json:
 *              schema:
 *              //   $ref: '#/components/schemas/CourseResponse'
 *       500:
 *         description: internal server error
 *
 */
router.post(
  "/createCourse",
  protect,
  upload.fields([
    { name: "course_image", maxCount: 1 },
    { name: "course_material", maxCount: 2 },
  ]),
  createCourse
);

/**
 * @openapi
 * '/courses/updateCourse{id}':
 *  patch:
 *    tags:
 *      - courses
 *    security:
 *       - Authorization: []
 *    summary: Update a course
 *    parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *    requestBody:
 *       content:
 *         multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *              description:
 *                type: string
 *              pricing:
 *                type: string
 *              category:
 *                type: string
 *              course_image:
 *                type: string
 *                format: binary
 *              course_material:
 *                type: string
 *                format: binary
 *    responses:
 *       201:
 *         description: you have sucessfully updated your course
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CourseResponse'
 *       500:
 *         description: internal server error
 *
 */
router.patch("/updateCourse/:id", protect, upload.fields([
  { name: "course_image", maxCount: 1 },
  { name: "course_material", maxCount: 2 },
]), updateCourse);

/**
 * @openapi
 * /courses/deleteCourse/{id}:
 *  delete:
 *      tags: [courses]
 *      description: delete a course
 *      security:
 *       - Authorization: []
 *      parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *      responses:
 *        200:
 *          description: you have sucessfully deleted a courses
 */
router.delete("/deleteCourse/:id", protect, deleteCourse);

/**
 * @openapi
 * '/courses/requestCourse{id}':
 *  post:
 *    tags:
 *      - courses
 *    summary: request a course
 *    security:
 *       - Authorization: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *    responses:
 *       201:
 *         description: you have sucessfully logged in
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CourseResponse'
 *       500:
 *         description: internal server error
 *
 */
router.post("/requestCourse/:id", protect, courseRequest);

/**
 * @openapi
 *  /courses/rate-courses/{id}:
 *   post:
 *     tags: [courses]
 *     summary: Rate a course
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
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: you have successfully rated the course
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 *       422:
 *         description: Invalid request body
 */
router.post("/rate-courses/:id", protect, rateCourses);

export default router;
