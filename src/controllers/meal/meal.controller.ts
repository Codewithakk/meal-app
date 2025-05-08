import { NextFunction, Request, Response } from "express";
import recipeModel from "../../models/recipe.model";
import httpError from "../../utils/httpError";
import httpResponse from "../../utils/httpResponse";
import userModel from "../../models/user.model";
import mongoose from "mongoose";

export const mealsController = {
  // ✅ Get all saved meals for a user
  getSavedMeals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return httpResponse(req, res, 400, "User ID is required");

      // ✅ Fetch user & populate saved meals in a single query
      const user = await userModel
        .findById(userId, "saved") // Only fetch 'saved' field
        .populate("saved", "name rating prepTime imageUrl")
        .lean();

      if (!user) return httpResponse(req, res, 404, "User not found");

      return httpResponse(req, res, 200, "Saved meals retrieved successfully", { savedMeals: user.saved || [] });
    } catch (error) {
      next(httpError(next, error, req, 500));
    }
  },  

  // ✅ Save or Remove a meal based on `isSaved`
  manageSavedMeals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const { mealId } = req.params; // Extract single mealId from URL params
      const { isSaved = true } = req.body; // Default to `true` if not provided
  
      if (!userId || !mealId) {
        return httpResponse(req, res, 400, "User ID and Meal ID are required");
      }
  
      // ✅ Validate meal ID format
      if (!mongoose.Types.ObjectId.isValid(mealId)) {
        return httpResponse(req, res, 400, "Invalid meal ID format");
      }
  
      // Check if the meal exists in the database
      const existingMeal = await recipeModel.findById(mealId).select("_id");
      if (!existingMeal) {
        return httpResponse(req, res, 404, "Meal not found");
      }
  
      // Determine update action based on `isSaved`
      const updateQuery = isSaved
        ? { $addToSet: { saved: mealId } } // Save meal
        : { $pull: { saved: mealId } }; // Remove meal
  
      // Update user's saved meals
      const user = await userModel
        .findByIdAndUpdate(userId, updateQuery, { new: true })
        .populate("saved", "name rating prepTime imageUrl -_id")
        .lean();
  
      return httpResponse(
        req,
        res,
        200,
        isSaved ? "Meal saved successfully" : "Meal removed from saved list",
        { savedMeals: user?.saved || [] }
      );
    } catch (error) {
      next(httpError(next, error, req, 500));
    }
  },
  
  // ✅ Get meals based on meal type
  mealtype: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mealType } = req.query;
      const userId = req.user?.userId;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort as string || "desc";
      const search = req.query.search as string || "";

      // Get current user's liked recipes
      const user = await userModel.findById(userId).select("likes").lean();
      const userLikedRecipes = user?.likes?.filter(like => like.isFavorite).map(like => like.recipe) || [];
   
      const searchFilter: any = {};
      if (mealType) {
        searchFilter.mealType = mealType;
      }

      if (search) {
        searchFilter.name = { $regex: search, $options: "i" }; // Case-insensitive search
      }

      const totalCount = await recipeModel.countDocuments(searchFilter)

      const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
      const validPage = Math.min(Math.max(1, page), totalPages);
      const skip = (validPage - 1) * limit;

      const recipesList = await recipeModel.aggregate([
        { $match: searchFilter },
        { $sort: { createdAt: sort === 'asc' ? 1 : sort === 'desc' ? -1 : -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            rating: 1,
            mood: 1,
            imageUrl: 1,
            prepTime: 1,
            isFavorite: { $in: ['$_id', userLikedRecipes] },
            createdAt: 1
          }
        }
      ]);

      return httpResponse(req, res, 200, recipesList.length > 0 ? "Meals Fetched Successfully" : "Meals not found", {
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: totalPages
        }, recipesList
      });

    } catch (error) {
      next(httpError(next, error, req, 500));
    }
  },

  groceryList: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next(httpError(next, "Unauthorized", req, 401));
        }

        const { recipeid } = req.query;
        if (!recipeid) {
            return next(httpError(next, "Recipe ID is required", req, 400));
        }

        // Fetch recipe details
        const details = await recipeModel
            .findById(recipeid)
            .select("ingredients")
            .populate("ingredients")
            .lean();

        if (!details) {
            return next(httpError(next, "Ingredients not found", req, 404));
        }

        return httpResponse(req, res, 200, "Ingredients details fetched successfully", { details });
    } catch (error) {
        return next(httpError(next, error, req, 500));
    }
}

};
