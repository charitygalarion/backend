const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const profileDir = path.join(uploadDir, 'profiles');
const recipeDir = path.join(uploadDir, 'recipes');
const ingredientDir = path.join(uploadDir, 'ingredients');
const scanDir = path.join(uploadDir, 'scans'); // ✅ Add scans directory

[uploadDir, profileDir, recipeDir, ingredientDir, scanDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = uploadDir;
    
    if (file.fieldname === 'profileImage') {
      folder = profileDir;
    } else if (file.fieldname === 'recipeImage') {
      folder = recipeDir;
    } else if (file.fieldname === 'ingredientImage') {
      folder = ingredientDir;
    } else if (file.fieldname === 'image' || file.fieldname === 'scanImage') {
      folder = scanDir; // ✅ For ingredient scanner images
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'scan-' + uniqueSuffix + ext); // ✅ Use scan- prefix
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // ✅ Increase to 10MB for scans (some photos might be larger)
  },
  fileFilter: fileFilter
});

// Single file uploads
const uploadProfileImage = upload.single('profileImage');
const uploadRecipeImage = upload.single('recipeImage');
const uploadIngredientImage = upload.single('ingredientImage');
const uploadScanImage = upload.single('image'); // ✅ Add for ingredient scanner

// Multiple file uploads (for recipes with multiple images)
const uploadRecipeImages = upload.array('recipeImages', 5);

module.exports = {
  upload,
  uploadProfileImage,
  uploadRecipeImage,
  uploadIngredientImage,
  uploadRecipeImages,
  uploadScanImage // ✅ Export the new upload
};