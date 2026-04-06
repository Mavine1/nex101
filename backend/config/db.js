import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MONGODB_URI from process.env:', process.env.MONGODB_URI);
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Error: ${error.message}`);
        process.exit(1);
    }
};