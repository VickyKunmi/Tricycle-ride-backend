import multer from "multer";
import fs from "fs";
import path from "path";


const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
export default upload;
