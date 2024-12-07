
const express = require("express");

const router = express.Router();

const cloudinary = require("cloudinary").v2;

const fileUpload = require("express-fileupload");

const convertToBase64 = require("../utils/convertToBase64");

// Import du model User et Offer

const User = require("../models/User");
const Offer = require("../models/Offer");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middleware/isAuthenticated");

// Import des datas pour reset de la BDD entre 2 sessions de formation)
const products = require("../data/products.json");

// Route qui  permet de récupérer une liste d'annonces, en fonction de filtres

router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet pour stocker les filtres
    let filters = {};

  
    if (req.query.title) {
      
      filters.product_name = new RegExp(req.query.title, "i");
    }
    
    if (req.query.priceMin) {
      
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    if (req.query.priceMax) {
     
      if (filters.product_price) {
      
        filters.product_price.$lte = req.query.priceMax;
      } else {
       
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }
    
    let sort = {};
   
    if (req.query.sort === "price-desc") {
    
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      
      sort = { product_price: 1 };
    }
    let page;
    
    if (Number(req.query.page) < 1) {
     
      page = 1;
    } else {
      
      page = Number(req.query.page);
    }
   
    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) 
      .limit(limit); 
    const count = await Offer.countDocuments(filters);

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});


router.get("/offer/:id", async (req, res) => {
  try {

    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone account.avatar",
    });
    res.json(offer);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {

    try {
      // destructuring des clefs title, description, price, brand, size, condition, color et city de l'objetreq.body
      const { title, description, price, brand, size, condition, color, city } =
        req.body;
     
      if (title && price && req.files?.picture) {

        // Création de la nouvelle annonce (sans l'image)
        const newOffer = new Offer({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            { MARQUE: brand },
            { TAILLE: size },
            { ÉTAT: condition },
            { COULEUR: color },
            { EMPLACEMENT: city },
          ],
          owner: req.user,
        });

        // Si on ne reçoit qu'une image (req.files.picture n'est donc pas un tableau)
        if (!Array.isArray(req.files.picture)) {
          // On vérifie qu'on a bien affaire à une image
          if (req.files.picture.mimetype.slice(0, 5) !== "image") {
            return res.status(400).json({ message: "You must send images" });
          }
          // Envoi de l'image à cloudinary
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.picture),
            {
              // Dans le dossier suivant
              folder: `api/vinted-v2/offers/${newOffer._id}`,
              // Avec le public_id suivant
              public_id: "preview",
            }
          );

          // ajout de l'image dans newOffer
          newOffer.product_image = result;
          // On rajoute l'image à la clef product_pictures
          newOffer.product_pictures.push(result);
        } else {
          // Si on a affaire à un tableau, on le parcourt
          for (let i = 0; i < req.files.picture.length; i++) {
            const picture = req.files.picture[i];
            // Si on a afaire à une image
            if (picture.mimetype.slice(0, 5) !== "image") {
              return res.status(400).json({ message: "You must send images" });
            }
            if (i === 0) {
              // On envoie la première image à cloudinary et on en fait l'image principale (product_image)
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `api/vinted-v2/offers/${newOffer._id}`,
                  public_id: "preview",
                }
              );
              // ajout de l'image dans newOffer
              newOffer.product_image = result;
              newOffer.product_pictures.push(result);
            } else {
              // On envoie toutes les autres à cloudinary et on met les résultats dans product_pictures
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `api/vinted-v2/offers/${newOffer._id}`,
                }
              );
              newOffer.product_pictures.push(result);
            }
          }
        }
        await newOffer.save();
        res.status(201).json(newOffer);
      } else {
        res
          .status(400)
          .json({ message: "title, price and picture are required" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// Route pour modifier une offre, elle prend un params
router.put(
  "/offer/update/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    // On va chercher l'offre correspondant à l'id
    const offerToModify = await Offer.findById(req.params.id);
    try {
     
      if (req.body.title) {
        // On remplace le product_name
        offerToModify.product_name = req.body.title;
      }
      // Idem pour la description
      if (req.body.description) {
        offerToModify.product_description = req.body.description;
      }
     
      if (req.body.price) {
        offerToModify.product_price = req.body.price;
      }
      
      const details = offerToModify.product_details;
      for (i = 0; i < details.length; i++) {
        // Pour chaque objet, si on a reçu un détail à modifier on met à jour la clef de l'objet
        if (details[i].MARQUE) {
          if (req.body.brand) {
            details[i].MARQUE = req.body.brand;
          }
        }
        if (details[i].TAILLE) {
          if (req.body.size) {
            details[i].TAILLE = req.body.size;
          }
        }
        if (details[i].ÉTAT) {
          if (req.body.condition) {
            details[i].ÉTAT = req.body.condition;
          }
        }
        if (details[i].COULEUR) {
          if (req.body.color) {
            details[i].COULEUR = req.body.color;
          }
        }
        if (details[i].EMPLACEMENT) {
          if (req.body.location) {
            details[i].EMPLACEMENT = req.body.location;
          }
        }
      }

      offerToModify.markModified("product_details");

     
      if (req.files?.picture) {
       
        await cloudinary.uploader.destroy(
          offerToModify.product_image.public_id
        );
        // On upload la nouvelle
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          {
            folder: `api/vinted-v2/offers/${offerToModify._id}`,
            public_id: "preview",
          }
        );
        // On remplace la clef product_image et le premier élément du tableau product_pictures
        offerToModify.product_image = result;
        offerToModify.product_pictures[0] = result;
      }
      // Sauvegarde de l'offre
      await offerToModify.save();
      res.status(200).json("Offer modified succesfully !");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// Route pour supprimer une offre, protégée par le middleware isAuthenticated, elle prend un params
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
   
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted-v2/offers/${req.params.id}`
    );
    //Une fois le dossier vide, je peux le supprimer !
    await cloudinary.api.delete_folder(`api/vinted-v2/offers/${req.params.id}`);
    // Je vais chercher l'offre dans mongoDB
    offerToDelete = await Offer.findById(req.params.id);
    // Je la supprime
    await offerToDelete.delete();
    res.status(200).json("Offer deleted succesfully !");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//ROUTE RESET ET INITIALISATION BDD
router.get("/reset-offers", fileUpload(), async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const allUserId = await User.find().select("_id");
  // Il y a 21 users dans le fichier owners.json
  if (allUserId.length > 22) {
    return res
      .status(400)
      .send(
        "Il faut d'abord reset la BDD de users. Voir la route /reset-users"
      );
  } else {
    // Supprimer toutes images dudossier offers
    const offers = await Offer.find();
    try {
   
      // Vider la collection Offer
      await Offer.deleteMany({});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }

    // Créer les annonces à partir du fichier products.json
    for (let i = 0; i < products.length; i++) {
      try {
        // Création de la nouvelle annonce
        const newOffer = new Offer({
          product_name: products[i].product_name,
          product_description: products[i].product_description,
          product_price: products[i].product_price,
          product_details: products[i].product_details,
          // créer des ref aléatoires
          owner: allUserId[Math.floor(Math.random() * allUserId.length)],
        });

        // Uploader l'image principale du produit

        const resultImage = await cloudinary.uploader.upload(
          products[i].product_image.secure_url,
          {
            folder: `api/vinted-v2/offers/${newOffer._id}`,
            public_id: "preview",
          }
        );

        // Uploader les images de chaque produit
        newProduct_pictures = [];
        for (let j = 0; j < products[i].product_pictures.length; j++) {
          try {
            const resultPictures = await cloudinary.uploader.upload(
              products[i].product_pictures[j].secure_url,
              {
                folder: `api/vinted-v2/offers/${newOffer._id}`,
              }
            );

            newProduct_pictures.push(resultPictures);
          } catch (error) {
            res.status(500).json({ message: error.message });
          }
        }

        newOffer.product_image = resultImage;
        newOffer.product_pictures = newProduct_pictures;

        await newOffer.save();
        console.log(`✅ offer saved : ${i + 1} / ${products.length}`);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
    res.send("Done !");
    console.log(`🍺 All offers saved !`);
  }
});

module.exports = router;
