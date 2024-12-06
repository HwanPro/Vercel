import multer from "multer";
import nextConnect from "next-connect";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

// Configuración de multer para almacenar imágenes en "public/uploads/images"
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "public/uploads/images"),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// Middleware de `next-connect` con tipado explícito
const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError: (err: Error, req: NextApiRequest, res: NextApiResponse) => {
    console.error(err.stack);
    res.status(500).end("Error en el servidor");
  },
  onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(405).end(`Método ${req.method} no permitido`);
  },
});

// Middleware para manejar la subida del archivo
const uploadMiddleware = upload.single("file");

// Función para ejecutar el middleware de multer manualmente
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};
