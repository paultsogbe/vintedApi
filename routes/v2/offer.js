// Import du package 'express'
const express = require("express");

const router = express.Router();

const cloudinary = require("cloudinary").v2;

const fileUpload = require("express-fileupload");

const convertToBase64 = require("../../utils/convertToBase64");

const User = require("../../models/User");
const Offer = require("../../models/Offer");

// Import du middleware isAuthenticated
const isAuthenticated = require("../../middleware/isAuthenticated");

// Import des datas 
const products = require("../../data/products.json");

// Route qui me permet de récupérer une liste d'annonces, en fonction de filtres

router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet 
    let filters = {};

    // Si on reçoit un query title
    if (req.query.title) {
     
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // Si on reçoit un query priceMin
    if (req.query.priceMin) {
      
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    // Si on reçoit un query priceMax
    if (req.query.priceMax) {
      // Si on a aussi reçu un query priceMin
      if (filters.product_price) {
        // On rajoute une clef $lte contenant le query en question
        filters.product_price.$lte = req.query.priceMax;
      } else {
        // Sinon on fait comme avec le query priceMax
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }
    // Création d'un objet sort 
    let sort = {};
    // Si on reçoit un query sort === "price-desc"
    if (req.query.sort === "price-desc") {
      // On réassigne cette valeur à sort
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      // Si la valeur du query est "price-asc" on réassigne cette autre valeur
      sort = { product_price: 1 };
    }
    // Création de la variable page 
    let page;
    // Si le query page n'est pas un nombre >= à 1
    if (Number(req.query.page) < 1) {
      // page sera par défaut à 1
      page = 1;
    } else {
      // Sinon page sera égal au query reçu
      page = Number(req.query.page);
    }
    // La variable limit sera égale au query limit reçu
    let limit = Number(req.query.limit);
    // On va chercher les offres correspondant aux query de filtre reçus grâce à filters, sort et limit. On populate la clef owner en n'affichant que sa clef account
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) 
      .limit(limit); 

    // cette ligne va me retourner le nombre d'annonces trouvées en fonction des filtres
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

// Route qui permmet de récupérer les informations d'une offre en fonction de son id. Cette route necessite un params
router.get("/offers/:id", async (req, res) => {
  try {
    // On va chercher l'offre correspondante à l'id reçu et on populate sa clef owner en sélectionnant uniquement les clefs username, phone et avatar de la clef account
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
  "/offers/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    // Route qui permet de poster une nouvelle annonce, elle utilise le middleware fileUpload afin de pouvoir lire les body de type formData. Seul quelqu'un de connecté peut faire cette requête.
    try {
      // destructuring des clefs title, description, price, brand, size, condition, color et city de l'objetreq.body
      const { title, description, price, brand, size, condition, color, city } =
        req.body;
      
      if (title && price && req.files?.picture) {
      
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

     
        if (!Array.isArray(req.files.picture)) {
          // On vérifie qu'on a bien affaire à une image
          if (req.files.picture.mimetype.slice(0, 5) !== "image") {
            return res.status(400).json({ message: "You must send images" });
          }
          // Envoi de l'image à cloudinary
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.picture),
            {
             
              folder: `api/vinted-v2/offers/${newOffer._id}`,
             
              public_id: "preview",
            }
          );

          // ajout de l'image dans newOffer
          newOffer.product_image = result;
          // On rajoute l'image à la clef product_pictures
          newOffer.product_pictures.push(result);
        } else {
          
          for (let i = 0; i < req.files.picture.length; i++) {
            const picture = req.files.picture[i];
            // Si on a afaire à une image
            if (picture.mimetype.slice(0, 5) !== "image") {
              return res.status(400).json({ message: "You must send images" });
            }
            if (i === 0) {

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

// Route pour modifier une offre, elle prend un params, on utilise fileUpload pour lire les body de type formData. La route est protégée par le middleware isAuthenticated. Seul quelqu'un de connecté peut faire cette requête.
router.put("/offers/:id", isAuthenticated, fileUpload(), async (req, res) => {
 
  const offerToModify = await Offer.findById(req.params.id);
  try {
  
    if (req.body.title) {
    
      offerToModify.product_name = req.body.title;
    }
  
    if (req.body.description) {
      offerToModify.product_description = req.body.description;
    }
   
    if (req.body.price) {
      offerToModify.product_price = req.body.price;
    }
    
    const details = offerToModify.product_details;
    for (i = 0; i < details.length; i++) {
    
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

    // Si on reçoit une nouvelle photo
    if (req.files?.picture) {
      // On supprime l'ancienne
      await cloudinary.uploader.destroy(offerToModify.product_image.public_id);
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
});

// Route pour supprimer une offre, protégée par le middleware isAuthenticated, elle prend un params
router.delete("/offers/:id", isAuthenticated, async (req, res) => {
  try {
  
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted-v2/offers/${req.params.id}`
    );
  
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


// RESET ET INITIALISATION BDD
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
