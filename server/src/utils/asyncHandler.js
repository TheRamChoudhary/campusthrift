const asyncHandler = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(function (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    });
  };
};

module.exports = asyncHandler;
