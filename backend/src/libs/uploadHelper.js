import cloudinary from "../libs/cloudinary.js";

export const uploadToCloudinary = async (fileBuffer) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{ resource_type: "auto" },
			(error, result) => {
				if (error) return reject(error);
				resolve(result);
			}
		);
		uploadStream.end(fileBuffer);
	});
};
