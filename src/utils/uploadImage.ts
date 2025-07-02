import cloudinary from "../lib/cloudinary";

export const uploadImage = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                if (result) resolve(result.secure_url);
                else reject(new Error('No se recibió resultado de Cloudinary.'));
            }
        );
        uploadStream.end(fileBuffer);
    });
};