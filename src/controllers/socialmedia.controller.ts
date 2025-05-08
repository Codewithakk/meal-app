import { NextFunction, Request, Response } from "express";
import httpError from "../utils/httpError";
import httpResponse from "../utils/httpResponse";

export const shareLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { url, platform } = req.query;

    if (!url || !platform) {
      return next(httpError(next, "Missing parameters: url or platform", req, 400));
    }

    const encodedUrl = encodeURIComponent(url as string);

    const shareLinks: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      instagram: `https://www.instagram.com/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}`,
      tumblr: `https://www.tumblr.com/share/link?url=${encodedUrl}`,
      email: `mailto:?subject=Check this out!&body=${encodedUrl}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=YOUR_APP_ID&redirect_uri=${encodedUrl}`,
      weibo: `https://service.weibo.com/share/share.php?url=${encodedUrl}`,
      vk: `https://vk.com/share.php?url=${encodedUrl}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      sms: `sms:?&body=${encodedUrl}`
    };

    const shareUrl = shareLinks[platform as string];

    if (!shareUrl) {
      return next(httpError(next, "Unsupported platform", req, 400));
    }
    res.status(200).json({ shareUrl });

  } catch (error) {
    next(httpError(next, "An error occurred while processing the request", req, 500));
  }
};