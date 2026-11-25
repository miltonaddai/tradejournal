import type { Request, Response, NextFunction } from 'express'
import { getLocalUser } from '../db/store.js'

export interface AppRequest extends Request {
  userId?: string
}

/**
 * The app runs as a single local user with no login. Every request is
 * attributed to that user, which is created on first use.
 */
export function localUser(req: AppRequest, _res: Response, next: NextFunction) {
  req.userId = getLocalUser().id
  next()
}
