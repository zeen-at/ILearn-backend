import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { courseInstance } from "../model/courseModel";

import { courseRequestInstance } from "../model/courseRequestsModel";
import { NotificationInstance } from "../model/notificationModel";
import { UserInstance } from "../model/userModel";

import { CourseRatingInstance } from "../model/courseRatingModel";
import { option, ratingCourseSchema } from "../utils/utility";
import { Op } from "sequelize";

interface requestedCourse extends courseInstance {
  tutor: UserInstance;
}

interface CourseWithTutorCount extends courseInstance {
  count: number;
  tutorCoursesCount: number;
}

const addCourse = async (req: Request, res: Response) => {
  try {
    const { name, description, category, price } = req.body;
    const course = await courseInstance.create({
      name,
      description,
      category,
      price,
    });

    return res.status(200).json({
      message: "Course created successfully",
      course: course,
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/add-course",
      err,
    });
  }
};

//const getAllCourses = async () => {};

const getStudentHistory = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;

    const courses = await courseInstance.findAll({
      where: { tutorId: id },
    });
    return res.status(200).json({
      courses: courses,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
  console.log(req.user);
};

//To Get All Courses
const getAllCourses = async (req: Request, res: Response) => {
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
        [Op.or]: [
          { description: { [Op.substring]: `${query}` } },
          { title: { [Op.substring]: `${query}` } },
        ],
      };
    } else {
      queryPage = {};
    }
    const findCourse = await courseInstance.findAndCountAll({
      where: queryPage,
      attributes: [
        "category",
        "course_image",
        "title",
        "description",
        "rating",
        "pricing",
        "id",
      ],
      include: [
        {
          model: UserInstance,
          as: "tutor",
          attributes: ["name"],
        },
      ],
      limit: limitPerPage,
      offset,
    });
    // Calculate the total number of pages
    const totalPages = Math.ceil(findCourse.count / limitPerPage);
    // Return the results in a JSON response
    return res.status(200).json({
      courseNumber: findCourse.count,
      findCourse: findCourse.rows,
      totalPages,
      currentPage,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error: All Course",
      error,
    });
  }
};

const createCourse = async (req: JwtPayload, res: Response) => {
  try {
    //const userId = req.user?.id;
    const { title, description, category, pricing } = req.body;
    const course = await courseInstance.findOne({ where: { title } });
    console.log("course is ", course);
    if (course) {
      return res.status(400).json({
        Error: "This course title already exist, choose another title",
      });
    }
    const newCourse = await courseInstance.create({
      title,
      description,
      course_image: req.files?.course_image[0].path,
      pricing: pricing.toLocaleString(),
      category,
      tutorId: req.user?.id,
      course_material: req.files?.course_material[0].path,
    });

    return res.status(200).json({
      message: "You have successfully created a course",
      course: newCourse,
    });
  } catch (error: any) {
    return res.status(500).json({
      route: "/users/create-courses",
      Error: error.errors[0].message,
    });
  }
};

const updateCourse = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, pricing } = req.body;

    const course = await courseInstance.findOne({ where: { id } });
    if (!course) {
      return res.status(400).json({ Error: "This course does not exist" });
    }

    let fileImg = req.files.course_image
      ? req.files?.course_image[0]?.path
      : course.course_image;
    let fileMaterial = req.files.course_material
      ? req.files?.course_material[0]?.path
      : course.course_material;

    await course.update({
      title,
      description,
      category,
      pricing,
      course_image: fileImg,
      course_material: fileMaterial,
    });
    await course.save();

    const newlyUpdatedCourse = await courseInstance.findOne({ where: { id } });
    return res.status(200).json({
      message: "Your course has been successfully updated",
      course: newlyUpdatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/update-courses",
      error,
    });
  }
};

const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleteCourse = await courseInstance.destroy({
      where: { id: id },
    });

    return res.status(204).json();
    //jggj
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/delete-courses",
    });
  }
};

/**=========================== get AllNotifications for students ============================== **/

const courseRequest = async (req: Request, res: Response) => {
  try {
    //student Id requesting the course
    const id = req.user?.id;
    const courseId = req.params.id;

    //First check if that course exist and include the tutor details
    let course = (await courseInstance.findOne({
      where: {
        id: courseId,
      },
      include: ["tutor"],
    })) as requestedCourse;

    if (!course) return res.status(400).json({ Error: "No such course exist" });

    const courseRequested = await courseRequestInstance.findOne({
      where: {
        studentId: id,
        courseId,
        status: "pending",
        tutorId: course.tutor.id,
      },
    });

    ///check if you user has already requested a course
    if (courseRequested)
      return res.status(400).json({
        Error:
          "You have already requested this course, please wait for a response",
      });

    //Create course request
    const requestedCourse = await courseRequestInstance.create({
      courseId,
      tutorId: course.tutorId,
      studentId: id,
    });

    //Create notification for the tutor base on the user request.
    await NotificationInstance.create({
      notificationType: "course request",
      receiver: course.tutorId,
      description: `A student requested ${course.title}`,
      sender: id,
      courseId,
    });
    // also for user
    //Return a message, your course request is successful
    return res.status(200).json({
      message: `you have successfully requested for ${course.title}`,
      course,
      requestedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal Server Error /users/getNotifications",
      error,
    });
  }
};

const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let course = (await courseInstance.findOne({
      where: { id },
      include: [
        "tutor",
        {
          model: CourseRatingInstance,
          as: "course_ratings",
          attributes: ["id", "description", "ratingValue"],
        },
      ],
    })) as CourseWithTutorCount;
    if (!course) {
      return res.status(400).json({
        Error: "This course does not exist",
      });
    }

    const tutorCoursesCount = await courseInstance.count({
      where: { tutorId: course.tutorId },
    });
    course = {
      ...course.toJSON(),
      tutorCoursesCount,
    } as CourseWithTutorCount;
    //console.log(resp);

    return res.status(200).json({
      message: "Successfully fetched course",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/courses/getSingleCourse",
      error,
    });
  }
};
const requestCourseById = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const courseId = req.params.id;
  const user = await UserInstance.findOne({ where: { id } });
  if (!user) {
    res.status(401);
    throw new Error("Not Authorized");
  }
  const course = await courseInstance.findOne({ where: { id: courseId } });
  if (course) {
    res.status(200).json(course);
  } else {
    res.status(404);
    throw new Error("Course Not Found");
  }
};

// ================================= Course Rating ==============================
const rateCourses = async (req: Request, res: Response) => {
  const { id } = req.user!;

  try {
    const validateResult = ratingCourseSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    const { courseId, ratingValue, description } = validateResult.value;

    const course = await courseInstance.findOne({
      where: { id: req.params.id },
    });
    if (!course) {
      return res.status(400).json({
        Error: "Course does not exist",
      });
    }
    const alreadyRatedCourse = await CourseRatingInstance.findOne({
      where: { studentId: id, courseId: req.params.id },
    });
    if (alreadyRatedCourse) {
      return res
        .status(401)
        .send({ message: "You cannot rate a course more than once" });
    }

    const rateCourse = await CourseRatingInstance.create({
      ratingValue,
      description,
      courseId: req.params.id,
      studentId: id,
    });

    const courseRatings = await CourseRatingInstance.findAll({
      where: { courseId: req.params.id },
    });
    const totalRating = courseRatings.reduce((acc, curr) => {
      return acc + curr.ratingValue;
    }, 0);
    let averageRating = totalRating / courseRatings.length;
    averageRating = parseFloat(averageRating.toFixed(1));
    await courseInstance.update(
      { rating: averageRating },
      { where: { id: req.params.id } }
    );

    return res.status(200).json({
      message: "Course rated successfully",
      rateCourse,
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/courses/rate-course",
      err,
    });
  }
};

export {
  getAllCourses,
  getCourseById,
  getStudentHistory,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourse,
  courseRequest,
  rateCourses,
  requestCourseById,
};
