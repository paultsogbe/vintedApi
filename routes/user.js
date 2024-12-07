
const express = require("express");

const router = express.Router();

// uid2 et crypto-js 
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Middleware permettant de recevoir des formData
const fileUpload = require("express-fileupload");

const convertToBase64 = require("../utils/convertToBase64");
// Import du package cloudinary
const cloudinary = require("cloudinary").v2;

// Package qui permet de générer des données aléatoires 
const { faker } = require("@faker-js/faker");

const owners = require("../data/owners.json");

const User = require("../models/User");
const Offer = require("../models/Offer");


router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    // Recherche dans la BDD. Est-ce qu'un utilisateur possède cet email ?
    const user = await User.findOne({ email: req.body.email });

    
    if (user) {
      res.status(409).json({ message: "This email already has an account" });

      
    } else {
    
      if (req.body.email && req.body.password && req.body.username) {
       

       
        // Générer le token et encrypter le mot de passe
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        // Étape 2 : créer le nouvel utilisateur
        const newUser = new User({
          email: req.body.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
        });

        // Si je reçois une image, je l'upload sur cloudinary et j'enregistre le résultat dans la clef avatar de la clef account de mon nouvel utilisateur
        if (req.files?.avatar) {
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.avatar),
            {
              folder: `api/vinted-v2/users/${newUser._id}`,
              public_id: "avatar",
            }
          );
          newUser.account.avatar = result;
        }

        // Étape 3 : sauvegarder ce nouvel utilisateur dans la BDD
        await newUser.save();
        res.status(201).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        // l'utilisateur n'a pas envoyé les informations requises ?
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
     
      if (
        SHA256(req.body.password + user.salt).toString(encBase64) === user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

// CETTE ROUTE SERT AU RESET DE LA BDD ENTRE 2 SESSIONS 
router.get("/reset-users", async (req, res) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");

    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      
      try {
      
        await User.deleteMany({});
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

      // Créer les users

      // Admin User
      try {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256("azerty" + salt).toString(encBase64);

        const adminUser = new User({
          email: "nono@lereacteur.io",
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: "Nono",
          },
        });


        const resultImage = await cloudinary.uploader.upload(
          faker.image.avatar(),
          {
            folder: `api/vinted-v2/users/${adminUser._id}`,
            public_id: "avatar",
          }
        );

        adminUser.account.avatar = resultImage;
        // sauvegarder l'admin user dans la BDD
        await adminUser.save();
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Error when creating admin user : " + error.message });
      }
     
      const userTab = [];
     
      const profilePicturesTabPromises = [];
      // Random Users
      for (let i = 0; i < 21; i++) {
        try {
          // Étape 1 : encrypter le mot de passe
         
          const token = uid2(64);
          const salt = uid2(64);
          const hash = SHA256("azerty" + salt).toString(encBase64);

          // Étape 2 : créer le nouvel utilisateur
          const newUser = new User({
            email: faker.internet.email().toLowerCase(),
            token: token,
            hash: hash,
            salt: salt,
            account: {
              username: faker.internet.userName(),
            },
          });
          // On push tous les users dans le tableau
          userTab.push(newUser);

          // Étape 3 : uploader la photo de profile du user

          // On push dans ce tableau les promesses d'upload
          profilePicturesTabPromises.push(
            cloudinary.uploader.upload(faker.image.avatar(), {
              folder: `api/vinted-v2/users/${newUser._id}`,
              public_id: "avatar",
            })
          );
        } catch (error) {
          return res.status(500).json({ message: error.message });
        }
      }
      // On attend la résolution des upload et on a les resultats dans ce tableau
      const profilePicturesTabPromisesResult = await Promise.all(
        profilePicturesTabPromises
      );

      // On parcourt le tableau de user et on leurs assigne à chacun une url renvoyée par cloudinary
      for (let j = 0; j < userTab.length; j++) {
        userTab[j].account.avatar = profilePicturesTabPromisesResult[j];
      }

      // On crée un tableau de promesse de sauvegarde des users
      const userSavePromises = userTab.map((user) => {
        return user.save();
      });

      // On attend qu'ils sonient tous sauvegardés
      await Promise.all(userSavePromises);

      res.status(200).json("🍺 All users saved !");
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = router;
