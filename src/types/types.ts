import { Request } from 'express'

export interface AuthRequest extends Request {
    user?: {
        userId: string
    }
}

declare module 'express' {
    interface Request {
        user?: {
            userId: string
            id?: string
            email?: string
        }
    }
}

declare module 'socket.io' {
    interface Socket {
        user?: {
            userId?: string
        }
    }
}
export type THttpResponse = {
    success: boolean
    statusCode: number
    request: {
        ip?: string | null
        method: string
        url: string
    }
    message: string
    data: unknown
}

export type THttpError = {
    success: boolean
    statusCode: number
    request: {
        ip?: string | null
        method: string
        url: string
    }
    message: string
    data: unknown
    trace?: object | null
}
