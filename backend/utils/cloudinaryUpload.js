const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Uploads an image buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer from multer
 * @param {string} folder - The Cloudinary folder name
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
const uploadToCloudinary = (buffer, folder = 'yebichu_general') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

module.exports = { uploadToCloudinary };
