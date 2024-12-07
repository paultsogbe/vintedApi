const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

/* Votre clé privée doit être indiquée ici */
const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  //   console.log(req.body);
  try {
    // On crée une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction
      amount: (req.body.amount * 100).toFixed(0),
      // Devise de la transaction
      currency: "eur",
      // Description du produit
      description: `Paiement vinted pour : ${req.body.title}`,
    });

    res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
