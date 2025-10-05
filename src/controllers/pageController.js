import path from 'path';
import serverConfig from '../config/serverConfig.js';

export function servePage(fileName){
	return (_req, res) => {
		res.sendFile(path.join(serverConfig.PUBLIC_DIR, fileName));
	};
}


