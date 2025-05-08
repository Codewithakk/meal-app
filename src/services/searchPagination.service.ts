import { Request, Response } from 'express';
import Post from '../models/community/userPost.model';
export const getFilteredPosts = async (req: Request, res: Response) => {
  const { search, page = 1, limit = 10 } = req.query;

  const query = search ? { caption: { $regex: search, $options: 'i' } } : {};
  const posts = await Post.find(query)
    .populate('user', 'name')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json(posts);
};
