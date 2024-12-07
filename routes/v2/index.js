const express = require("express");
const router = express.Router();

const userRoutes = require("./user");
const offerRoutes = require("./offer");
const paymentRoutes = require("./payment");

router.use(userRoutes);
router.use(offerRoutes);
router.use(paymentRoutes);

module.exports = router;
