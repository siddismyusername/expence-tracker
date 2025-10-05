import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project root from src/config to two levels up
const projectRoot = path.resolve(__dirname, '../..');
const publicDir = path.join(projectRoot, 'public');

const serverConfig = {
	PORT: process.env.PORT || 3000,
	MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker',
	PUBLIC_DIR: publicDir,
};

export default serverConfig;


