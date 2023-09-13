import { UUIDV4 } from "sequelize";
import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config";
import { UserInstance } from "./userModel";

export interface TutorRatingAttribute {
    [x: string]: any;
    id: string;
    studentId: string;
    tutorId: string;
    ratingValue: number;
    description: string;
}

export class TutorRatingInstance extends Model<TutorRatingAttribute>{
    declare id: string;
    declare studentId: string;
    declare tutorId: string;
    declare ratingValue: number;
    declare description: string;
}

TutorRatingInstance.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    tutorId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    ratingValue: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        sequelize: db,
        tableName: "tutor_rating"
    });

TutorRatingInstance.belongsTo(UserInstance,
    {
        foreignKey: "studentId",
        as: "student"
    })