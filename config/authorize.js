const jwt = require("express-jwt");
const User = require("../model/user");

module.exports = authorize;

function authorize(roles = []) {
  if (typeof roles === "string") {
    roles = [roles];
  }

  const secret = "developersecretcode";

  return [
    jwt({ secret, algorithms: ["HS256"] }),

    async (req, res, next) => {
      const user = await User.findById(req.user.id);

      if (!user || (roles.length && !roles.includes(user.role))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user.role = user.role;
      next();
    },
  ];
}
