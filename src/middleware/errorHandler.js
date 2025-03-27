const errorHandler = (err, req, res, next) => {
    console.error(`Error: ${err.message}`); // Log error for debugging
  
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if no status code is set
    
    res.status(statusCode).json({
      message: err.message
    });
  };
  
  export default errorHandler;
  