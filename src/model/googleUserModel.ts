import { DataTypes, Model } from "sequelize";
import { db } from "../Config";

export interface GoogleAttributes {
    [x: string]: any;
    id: string;
    name: string;
    email: string;
    googleId: string
    
  }
  
  export class GoogleUserInstance extends Model<GoogleAttributes> {
    declare id: string;
    declare email: string;
    declare name: string;
    declare googleId: string

  }

  GoogleUserInstance.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  
      googleId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },  
    {
      sequelize: db,
      tableName: "google_users",
    }
  );
  