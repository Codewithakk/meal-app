import { Request, Response, NextFunction } from 'express'
import { SubscriptionPlan } from '../../models/subscriptionsPlan.model' // Adjust path as needed
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'

export const createSubscriptionPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, price, billingCycle, currency, features, isFree } = req.body
        const newPlan = new SubscriptionPlan({
            name,
            price,
            billingCycle,
            currency,
            features,
            isFree
        })
        const savedPlan = await newPlan.save()
        return httpResponse(req, res, 201, 'Subscription plan created successfully', { plan: savedPlan })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const updateSubscriptionPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId } = req.params
        const { name, price, billingCycle, currency, features, isFree } = req.body

        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(planId, { name, price, billingCycle, currency, features, isFree }, { new: true })

        if (!updatedPlan) {
            return httpError(next, new Error('Subscription plan not found'), req, 404)
        }

        return httpResponse(req, res, 200, 'Subscription plan updated successfully', { plan: updatedPlan })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const deleteSubscriptionPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId } = req.params
        const deletedPlan = await SubscriptionPlan.findByIdAndDelete(planId)

        if (!deletedPlan) {
            return httpError(next, new Error('Subscription plan not found'), req, 404)
        }

        return httpResponse(req, res, 200, 'Subscription plan deleted successfully', { plan: deletedPlan })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const getSubscriptionPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const plans = await SubscriptionPlan.find({})
        return httpResponse(req, res, 200, 'Subscription plans retrieved successfully', { plans })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const getSubscriptionPlanById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId } = req.params
        const plan = await SubscriptionPlan.findById(planId)

        if (!plan) {
            return httpError(next, new Error('Subscription plan not found'), req, 404)
        }

        return httpResponse(req, res, 200, 'Subscription plan retrieved successfully', { plan })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
