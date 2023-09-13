import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";
import { UserInstance } from "./userModel";
import { CourseRatingInstance } from "./courseRatingModel";

export interface courseAttributes {
  [x: string]: any;
  id: string;
  title: string;
  description: string;
  rating: number;
  tutorId: string;
  pricing: string;
  category: string;
  course_image: string;
  course_material: string;
}

export class courseInstance extends Model<courseAttributes> {
  declare id: string;
  declare title: string;
  declare description: string;
  declare tutorId: string;
  declare pricing: string;
  declare category: string;
  declare course_image: string;
  declare course_material: string;
  declare rating: number;
}

courseInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // tutor_Name: {
    //   type: DataTypes.UUID,
    //   allowNull: false,
    // },
    tutorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    pricing: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_material: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },

  {
    sequelize: db,
    tableName: "courses",
  }
);

// UserInstance.hasMany(ReminderInstance, {
//   foreignKey: "userId",
//   as: "reminder",
// });

courseInstance.hasMany(CourseRatingInstance, {
  foreignKey: "courseId",
  as: "course_ratings",
});
