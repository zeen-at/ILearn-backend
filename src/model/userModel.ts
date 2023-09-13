import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";
import { courseInstance } from "./courseModel";
import { courseRequestInstance } from "./courseRequestsModel";
import { ReminderInstance } from "./reminderModel";
import { AreaOfInterestInstance } from "./areaOfInterestModel";
import { AvailabilityInstance } from "./availabilityModel";
import { NotificationInstance } from "./notificationModel";
import { StudentCoursesInstance } from "./users/students/studentCoursesModel";
import { CourseRatingInstance } from "./courseRatingModel";

export interface UserAttributes {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  password: string;
  areaOfInterest: Array<string>;
  userType: string;
  verified: boolean;
  salt: string;
  image: string;
  rating: number;
  facebookId:string
  about: string;
  expertise: Array<string>;
  location: string;
  status: boolean;
}

export class UserInstance extends Model<UserAttributes> {
  declare id: string;
  declare email: string;
  declare name: string;
  declare password: string;
  declare areaOfInterest: Array<string>;
  declare userType: string;
  declare verified: boolean;
  declare salt: string;
  declare image: string;
  declare rating: number;
  declare facebookId:string
  declare about: string;
  declare expertise: Array<string>;
  declare location: string;
  declare status: boolean;
}

UserInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    facebookId:{
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "Email address required" },
        isEmail: { msg: "Please provide a valid email" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        notEmpty: { msg: "Provide a password" },
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notNull: { msg: "User must be verified" },
        notEmpty: { msg: "User not verified" },
      },
      defaultValue: false,
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Salt is required" },
        notEmpty: { msg: "Provide a salt" },
      },
    },
    areaOfInterest: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      validate: {
        customValidator: (values: []) => {
          values.forEach((value) => {
            const enums = [
              "Mathematics",
              "Physics",
              "Coding",
              "Graphics Design",
              "Video Editing",
              "Chemistry",
            ];
            if (!enums.includes(value)) {
              throw new Error("not a valid option");
            }
          });
        },
      },
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        customValidator: (value: any) => {
          const enums = ["Tutor", "Student"]; // to be changed to small letter
          if (!enums.includes(value)) {
            throw new Error("value should be a Student or a Tutor");
          }
        },
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    about: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    expertise: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ["Mathematics"],
      validate: {
        customValidator: (values: []) => {
          values.forEach((value) => {
            const enums = [
              "Mathematics",
              "Physics",
              "Coding",
              "Graphics Design",
              "Video Editing",
              "Chemistry",
            ];
            if (!enums.includes(value)) {
              throw new Error("not a valid option");
            }
          });
        },
      },
    },
  },
  {
    sequelize: db,
    tableName: "user",
  }
);

AreaOfInterestInstance.belongsTo(UserInstance, {
  foreignKey: "userId",
  as: "user",
});

UserInstance.hasMany(AreaOfInterestInstance, {
  foreignKey: "userId",
  as: "interests",
});

UserInstance.hasMany(courseInstance, {
  foreignKey: "tutorId",
  as: "courses",
});
UserInstance.hasMany(ReminderInstance, {
  foreignKey: "userId",
  as: "reminder",
});

courseInstance.belongsTo(UserInstance, {
  foreignKey: "tutorId",
  as: "tutor",
});

UserInstance.hasMany(AvailabilityInstance, {
  foreignKey: "userId",
  as: "availability",
});

UserInstance.hasOne(CourseRatingInstance, {
  foreignKey: "studentId",
  as: "student",
});
