import multer from "multer";
import nextConnect from "next-connect";
import path from "path";
import { NextApiResponse } from "next";
import { NextApiRequestWithFile } from "@/types/next";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "public/uploads/images"),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

const apiRoute = nextConnect<NextApiRequestWithFile, NextApiResponse>({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(500).end("Error en el servidor");
  },
  onNoMatch: (req, res) => {
    res.status(405).end(`Método ${req.method} no permitido`);
  },
});

apiRoute.use(upload.single("file"));

apiRoute.post((req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo." });
  }

  res.status(200).json({ data: "Archivo subido correctamente", file: req.file });
});

export default apiRoute;
