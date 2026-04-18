export const internalAuth = (req, res, next) => {
  const apiKey = req.header('X-Internal-Secret');
  if (!apiKey || apiKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({ error: 'Unauthorized internal Machine-to-Machine request' });
  }
  next();
};
