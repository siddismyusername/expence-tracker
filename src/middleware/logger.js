function requestLogger(req, _res, next){
	const start = Date.now();
	const userId = req.user ? req.user.userId : 'anonymous';
	
	// eslint-disable-next-line no-console
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${userId}`);
	
	_res.on('finish', ()=>{
		const ms = Date.now() - start;
		// eslint-disable-next-line no-console
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${_res.statusCode} ${ms}ms`);
	});
	next();
}

// Performance monitoring middleware
function performanceMonitor(req, res, next) {
	const start = process.hrtime();
	
	res.on('finish', () => {
		const diff = process.hrtime(start);
		const time = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds
		
		// Log slow queries (> 1000ms)
		if (time > 1000) {
			console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} took ${time.toFixed(2)}ms`);
		}
	});
	
	next();
}

module.exports = {
	requestLogger,
	performanceMonitor
};



