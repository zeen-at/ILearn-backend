import { Sequelize, Model, DataTypes } from "sequelize";
import { db } from "../Config/index";


export interface AvailabilityAttributes {
    [x: string]: any;
    id: string;
    userId: string;
    availableTime: Array<string>;
    selectedTime: Array<string>
    availableDate: Date;
    availableSlots: number
  }

export class AvailabilityInstance extends Model<AvailabilityAttributes> {
    declare id: string;
    declare userId: string;
    declare availableTime: Array<string>;
    declare selectedTime: Array<string>
    declare availableDate: Date;
    declare availableSlots: number
  }

AvailabilityInstance.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
    },
    userId: {
        type: DataTypes.UUID,
        unique: false,
    },
    availableTime: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
    availableDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    availableSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    selectedTime: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    }
},
{
    sequelize: db,
    tableName: 'availability'
})