import { DataType, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";

export interface AreaOfInterestAttributes {
  [x: string]: any;
  id: string;
  courseName: string;
  userId: string;
}

export class AreaOfInterestInstance extends Model<AreaOfInterestAttributes> {
  declare id: string;
  declare courseName: string;
  declare userId: string;
}

AreaOfInterestInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    courseName: {
      type: DataTypes.STRING,
      defaultValue: "Mathematics",
      validate: {
        customValidator: (value: any) => {
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
        },
      },
    },
    userId: {
      type: DataTypes.UUID,
      unique: true,
    },
  },
  {
    sequelize: db,
    tableName: "interests",
  }
);
