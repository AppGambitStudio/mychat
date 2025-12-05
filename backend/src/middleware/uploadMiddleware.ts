import multer from 'multer';
import path from 'path';

// Use memory storage to keep it stateless and simple for now.
// For larger files, we might want to switch to disk storage or S3.
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedExtensions = ['.pdf', '.docx', '.html', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, DOCX, HTML, TXT, MD'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});
