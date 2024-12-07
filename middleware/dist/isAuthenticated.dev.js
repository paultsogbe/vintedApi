"use strict";

var User = require("../models/User");

var isAuthenticated = function isAuthenticated(req, res, next) {
  var token, user;
  return regeneratorRuntime.async(function isAuthenticated$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

          if (!req.headers.authorization) {
            _context.next = 14;
            break;
          }

          // j'enleve "Bearer " du token reçu
          token = req.headers.authorization.replace("Bearer ", ""); // Cherche dans la BDD un user qui a ce token en ne récupérant que les clef account et _id

          _context.next = 5;
          return regeneratorRuntime.awrap(User.findOne({
            token: token
          }).select("account _id"));

        case 5:
          user = _context.sent;

          if (!user) {
            _context.next = 11;
            break;
          }

          // On rajoute une clef user à req contenant le user trouvé
          req.user = user; // On passe à la suite

          next();
          _context.next = 12;
          break;

        case 11:
          return _context.abrupt("return", res.status(401).json({
            message: "Unauthorized"
          }));

        case 12:
          _context.next = 15;
          break;

        case 14:
          return _context.abrupt("return", res.status(401).json({
            message: "Unauthorized"
          }));

        case 15:
          _context.next = 20;
          break;

        case 17:
          _context.prev = 17;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            message: _context.t0.message
          });

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 17]]);
};

module.exports = isAuthenticated;
//# sourceMappingURL=isAuthenticated.dev.js.map
