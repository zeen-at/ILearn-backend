import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: process.env.CLOUDINARY_DIRECTORY,
    };
  },
});

// const fileFilter = (req: any, file: any, cb: any) => {
//     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'pdf/pdf') {
//         cb(null, true);
//     } else {
//         cb({message: 'File type not supported'}, false);
//     }
// }

export const upload = multer({
  storage: storage,
  //    fileFilter: fileFilter,
  //     limits: {fieldSize: 1024 * 1024 * 5}
});
