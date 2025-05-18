import { Request, Response, NextFunction } from 'express'
import { InfoModel } from '../models/info.model'
import httpResponse from '../utils/httpResponse'
import httpError from '../utils/httpError'

export const getInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params
    try {
        const doc = await InfoModel.findOne({ type })

        if (!doc) {
            return httpResponse(req, res, 404, `${type} not found`)
        }
        console.log('get', doc)
        httpResponse(req, res, 200, 'Success', doc)
    } catch (err) {
        httpError(next, err, req, 500)
    }
}

export const createInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params
    const { content } = req.body

    try {
        const exists = await InfoModel.findOne({ type })

        if (exists) {
            return httpResponse(req, res, 409, `${type} already exists`)
        }

        const doc = new InfoModel({ type, content })
        await doc.save()

        httpResponse(req, res, 201, `${type} created successfully`, doc)
    } catch (err) {
        httpError(next, err, req, 500)
    }
}

export const updateInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params
    const { content } = req.body

    try {
        const doc = await InfoModel.findOneAndUpdate({ type }, { content, updatedAt: new Date() }, { new: true, upsert: true })
        console.log('update', doc)
        httpResponse(req, res, 200, `${type} updated successfully`, doc)
    } catch (err) {
        httpError(next, err, req, 500)
    }
}
