const cloudinary = require('../config/cloudinary');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    let uploadOptions = { folder: 'snapgram-ai', resource_type: 'auto' };

    if (req.body && req.body.crop) {
      try {
        const cropData = typeof req.body.crop === 'string' ? JSON.parse(req.body.crop) : req.body.crop;
        if (cropData && cropData.width && cropData.height) {
          uploadOptions.transformation = [
            {
              x: Math.max(0, Math.round(cropData.x || 0)),
              y: Math.max(0, Math.round(cropData.y || 0)),
              width: Math.round(cropData.width),
              height: Math.round(cropData.height),
              crop: 'crop',
            },
            {
              width: 512,
              height: 512,
              crop: 'fill',
            },
          ];
        }
      } catch (cropErr) {
        console.warn('Crop transformation error:', cropErr);
      }
    }

    // Wrap Cloudinary upload stream in a Promise
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type, // 'image' or 'video'
        width: result.width,
        height: result.height,
      }
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    const errorMessage = error?.message?.includes('File size too large')
      ? 'File size exceeds maximum 10MB limit. Please choose a smaller photo or video.'
      : (error?.message || 'Failed to upload file');
    res.status(400).json({ success: false, message: errorMessage });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:public_id
// @access  Private
const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({ success: false, message: 'No public_id provided' });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to delete image (might not exist)' });
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
