export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    res.status(400).json({ error: e.errors });
  }
};
