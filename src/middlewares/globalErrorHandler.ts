// import { NextFunction, Request, Response } from 'express'
// import { THttpError } from '../types/types'

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export default (err: THttpError, _: Request, res: Response, __: NextFunction) => {
//     res.status(err.statusCode).json(err)
// }

import { NextFunction, Request, Response } from "express";
import { THttpError } from "../types/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (err: THttpError, _: Request, res: Response, __: NextFunction) => {
    console.error("Error:", err);

    // Ensure a valid status code (default to 500 if undefined)
    const statusCode = err.statusCode && Number.isInteger(err.statusCode) && err.statusCode >= 100 && err.statusCode <= 599 
        ? err.statusCode 
        : 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: err,
    });
};
