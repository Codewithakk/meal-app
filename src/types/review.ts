export interface Review {
  reviewId: number;
  userName: string;
  userProfile?: string;
  rating?: number;
  review: string;
  imgs?: string[];
}
