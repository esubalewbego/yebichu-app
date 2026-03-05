const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'yebichu_packages' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ error: 'Failed to upload image' });
                }
                res.status(200).json({ url: result.secure_url });
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Upload catch error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadImage };
