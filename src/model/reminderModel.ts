import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";

export interface ReminderAttributes {
  [x: string]: any;
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  userId: string;
}

export class ReminderInstance extends Model<ReminderAttributes> {
  declare id: string;
  declare title: string;
  declare description: string;
  declare startTime: Date;
  declare endTime: Date;
  declare userId: string;
}

ReminderInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
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

    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },

  {
    sequelize: db,
    tableName: "reminder",
  }
);
