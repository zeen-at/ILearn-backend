import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";
import { courseRequestInstance } from "./courseRequestsModel";
import { UserInstance } from "./userModel";

export interface CourseRatingAttributes {
  [x: string]: any;
  id: string;
  description: string;
  courseId: string;
  studentId: string;
  ratingValue: number;
}

export class CourseRatingInstance extends Model<CourseRatingAttributes> {
  declare id: string;
  declare description: string;
  declare courseId: string;
  declare studentId: string;
  declare ratingValue: number;
}

CourseRatingInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    ratingValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },

  {
    sequelize: db,
    tableName: "rating",
  }
);

// UserInstance.hasOne(courseRequestInstance, {
//   foreignKey: "studentId",
//   as: "student",
// });
