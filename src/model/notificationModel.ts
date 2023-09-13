import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config";
import { courseInstance } from "./courseModel";
import { UserInstance } from "./userModel";

enum NotificationType {
  "course_request",
  "rating",
  "session",
}

export interface NotificationAttributes {
  [x: string]: any;
  id: string;
  notificationType: NotificationType;
  receiver: string;
  courseId: string;
  sender: string;
  description: string;
  courseRatingValue: number;
  tutorRatingValue: number;
  status: string;
  createdAt: string;
}

export class NotificationInstance extends Model<NotificationAttributes> {
  declare id: string;
  declare notificationType: NotificationType;
  declare receiver: string;
  declare courseId: string;
  declare sender: string;
  declare description: string;
  declare courseRatingValue: number;
  declare tutorRatingValue: number;
  declare status: string;
  declare createdAt: Date;
}

NotificationInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    notificationType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "notificationType is required" },
        notEmpty: { msg: "Provide a notificationType " },
        isIn: [["course request", "rating", "session", "payment"]],
      },
    },
    receiver: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sender: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    courseRatingValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tutorRatingValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unread",
    },
  },
  {
    sequelize: db,
    tableName: "notifications",
  }
);

NotificationInstance.belongsTo(courseInstance, {
  as: "course",
});

NotificationInstance.belongsTo(UserInstance, {
  foreignKey: "sender",
  as: "theSender",
});

NotificationInstance.belongsTo(UserInstance, {
  foreignKey: "receiver",
  as: "theReceiver",
});
