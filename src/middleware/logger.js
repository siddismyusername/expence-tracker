export function requestLogger(req, _res, next){
	const start = Date.now();
	// eslint-disable-next-line no-console
	console.log(`${req.method} ${req.originalUrl}`);
	_res.on('finish', ()=>{
		const ms = Date.now() - start;
		// eslint-disable-next-line no-console
		console.log(`${req.method} ${req.originalUrl} -> ${_res.statusCode} ${ms}ms`);
	});
	next();
}


