import multer from 'multer';

const storage = multer.memoryStorage();

// Creamos el middleware de multer
const upload = multer({
  storage: storage,
  // Podemos añadir límites, como el tamaño del archivo
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5 MB
  },
  // Filtro de archivos para aceptar solo imágenes
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes.') as any, false);
    }
  },
});

export default upload;
