declare module "multer" {
  import { RequestHandler } from "express";

  interface StorageEngine {
    _handleFile(req: any, file: any, cb: (error?: any, info?: any) => void): void;
    _removeFile(req: any, file: any, cb: (error: Error | null) => void): void;
  }

  interface MulterOptions {
    storage?: StorageEngine;
  }

  interface MulterInstance {
    single(fieldname: string): RequestHandler;
  }

  function multer(options?: MulterOptions): MulterInstance;
  namespace multer {
    function diskStorage(options: any): StorageEngine;
  }
  export = multer;
}
