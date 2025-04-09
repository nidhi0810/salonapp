function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user || !allowedRoles.includes(req.session.user.role)) {
      console.log(req.session.user.role);
      return res.status(403).render("access-denied"); // or send JSON
    }
    next();
  };
}

module.exports = { checkRole };
