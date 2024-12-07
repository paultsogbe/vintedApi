"use strict";

var express = require("express");

var router = express.Router();

var createStripe = require("stripe"); //stripe api secret key


var stripe = createStripe(process.env.STRIPE_API_SECRET);
router.post("/payment", function _callee(req, res) {
  var _ref, status;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log(req.body);
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(stripe.charges.create({
            amount: (req.body.amount * 100).toFixed(0),
            currency: "eur",
            description: "Paiement vinted pour : ".concat(req.body.title),
            source: req.body.token
          }));

        case 4:
          _ref = _context.sent;
          status = _ref.status;
          res.json({
            status: status
          });
          _context.next = 13;
          break;

        case 9:
          _context.prev = 9;
          _context.t0 = _context["catch"](1);
          console.log(_context.t0.message);
          res.status(500).json({
            message: _context.t0.message
          });

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 9]]);
});
module.exports = router;
//# sourceMappingURL=payment.dev.js.map
