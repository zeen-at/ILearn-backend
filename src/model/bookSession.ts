import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";
import { AvailabilityInstance } from "./availabilityModel";
import { UserInstance } from "./userModel";
export interface tutorRequestAttributes {
  [x: string]: any;
  id: string;
  tutorId: string;
  studentId: string;
  pickedTime: string;
  availabilityId: string;
}
export class tutorRequestInstance extends Model<tutorRequestAttributes> {
  declare id: string;
  declare tutorId: string;
  declare studentId: string;
  declare pickedTime: string;
  declare availabilityId: string}
tutorRequestInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tutorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    pickedTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    availabilityId:{
      type:DataTypes.UUID,
      allowNull: false,
    }
  },
  {
    sequelize: db,
    tableName: "scheduleTime",
  }
);
tutorRequestInstance.belongsTo(UserInstance, 
  {
     foreignKey: "studentId",
      as: "student"})
tutorRequestInstance.belongsTo(AvailabilityInstance, 
  {foreignKey: "availabilityId",
  as: "availableTime"})