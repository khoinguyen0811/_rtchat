import mongoose from "mongoose";

export const connectToDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_CONECTION_STRING);
		console.log("Connected to MongoDB successfully");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
		process.exit(1);
	}
}