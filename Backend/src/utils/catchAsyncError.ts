import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";

export default function catchAsyncErrors(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>,
  catchFunction?: (e: unknown, res: Response) => void
): RequestHandler {
  return (req, res, next) => {
    const handleUnknownError = (e: unknown) => {
      if (e instanceof Error) {
        console.error(e);
        return res.status(500).json({ message: "Internal Server Error" });
      } else {
        console.error(e);
        return res.status(500).json({ message: "Unknown Error" });
      }
    };
    return fn(req, res, next).catch((e) => {
      if (catchFunction) catchFunction(e, res);
      else handleUnknownError(e);
    });
  };
}
