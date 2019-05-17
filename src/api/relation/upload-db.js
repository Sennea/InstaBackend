const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const GridFsStorage = require('multer-gridfs-storage')

const config = require('../../config')

const storage = new GridFsStorage({
    url: config.mongo.uri,
    file: (req, file) => {
        return {
            filename: path.parse(file.originalname).name + Date.now() + '.' + mime.extension(file.mimetype),    // dodaj date do pliku
            bucketName: 'relations',               // nazwa kolekcji
            metadata: {
                originalname: file.originalname
            }
        };
    }
});


function fileFilter (req, file, done) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
    // Mime types sa sprawdzane przed uploadem bazujac na naglowkach jakie wysyla przegladarka
    // Mime types nie sprawdza faktycznej zawartosci pliku!
    if (file.mimetype === mime.types.png || file.mimetype === mime.types.jpg) { return done(null, true) }

    done(new Error(`File type: ${file.mimetype} is not allowed!`))
}

const uploadDrive = multer({storage: storage, fileFilter: fileFilter}).single('file')

module.exports = uploadDrive