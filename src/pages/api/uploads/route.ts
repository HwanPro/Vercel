// src/pages/api/uploads/route.ts

import multer from 'multer';
import nextConnect from 'next-connect';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

// Configuración de multer para almacenar imágenes en "public/uploads/images"
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'public/uploads/images'),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// Middleware de `next-connect` con tipado explícito
const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError: (err: Error, req: NextApiRequest, res: NextApiResponse) => {
    console.error(err.stack);
    res.status(500).end('Error en el servidor');
  },
  onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(405).end(`Método ${req.method} no permitido`);
  },
});

// Middleware para manejar la subida del archivo
apiRoute.use(upload.single('file')); // 'file' debe coincidir con el campo del formulario

// Manejar la solicitud POST
apiRoute.post((req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
  }

  // Aquí puedes manejar la lógica después de la subida del archivo
  res.status(200).json({ data: 'Archivo subido correctamente', file: req.file });
});

export default apiRoute;
