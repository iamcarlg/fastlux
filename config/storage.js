const multer = require('multer');

//The path module provides utilities for working with file and directory paths.
const path = require('path');

// Set up multer for storing uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.cwd() + '/public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + path.extname(file.originalname))

    }
});
  
const upload = multer({ 

    dest: 'uploads',
    storage: storage,
    
    fileFilter(req,file,cb) {
        if(!file.originalname.match(/.(jpg|png|webp|SVG)$/)){
            return cb(new Error('Please upload picture in jpg/png/webp SVG, go back to the add page'))
        } 
        cb(undefined,true)
    }

 });

 module.exports = {storage, upload};