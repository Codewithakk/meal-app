import { v2 as cloudinary } from 'cloudinary';

// Delete Cloudinary Image
export async function deleteImages(imageId: Array<string>) {
    try {
        return await cloudinary.api.delete_resources(imageId);
    } catch (error) {
        console.error('Error deleting resources:', error);
    }
}