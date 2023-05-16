const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
  .then(
    (sauces) => {
      res.status(200).json(sauces);
    }
    )
    .catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
      );
    };
    
    exports.createSauce = (req, res, next) => {
      const sauceObject = JSON.parse(req.body.sauce);
      console.log(sauceObject);
      delete sauceObject.userId;
      const sauce = new Sauce({
        name: sauceObject.name,
        manufacturer: sauceObject.manufacturer,
        description: sauceObject.description,
        mainPepper: sauceObject.mainPepper,
        heat: sauceObject.heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        userDisliked: [],
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      });
      
      sauce.save()
      .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
      .catch(error => { res.status(400).json( { error })})
    };
    
    exports.getOneSauce = (req, res, next) => {
      // console.log("getOneSauce",req.params);
      Sauce.findOne({
        _id: req.params.id
      }).then(
        (sauce) => {
          // console.log("sauce",sauce)
          res.status(200).json(sauce);
        }
        ).catch(
          (error) => {
            res.status(404).json({
              error: error
            });
          }
          );
        };
        exports.modifySauce = (req, res, next) => {
          const sauceObject = req.file ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
          } : { ...req.body };
          
          delete sauceObject._userId;
          Sauce.findOne({_id: req.params.id})
          .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
              res.status(403).json({ message : 'unauthorized request'});
            } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
              .catch(error => res.status(401).json({ error }));
            }
          })
          .catch((error) => {
            res.status(400).json({ error });
          });
        };
        exports.deleteSauce = (req, res, next) => {
          Sauce.findOne({ _id: req.params.id})
          .then(sauce => {
            if (sauce.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
            } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({_id: req.params.id})
                .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                .catch(error => res.status(401).json({ error }));
              });
            }
          })
          .catch( error => {
            res.status(500).json({ error });
          });
        };
        exports.manageLikes = (req, res, next) => {
          const sauceObject = {...req.body};
          if (sauceObject.userId != req.auth.userId) {
            res.status(401).json({message: 'Not authorized'});
          } else { 
            Sauce.findOne({ _id: req.params.id})
            .then( sauce => {
            var usersLikedTab = sauce.usersLiked;
            var usersDislikedTab = sauce.usersDisliked;
            const userIdInUsersLiked = usersLikedTab.includes(sauceObject.userId);
            const userIdInUsersDisliked = usersDislikedTab.includes(sauceObject.userId);
              const like = sauceObject.like;
              switch (like) {
                case 1:
                  if (!userIdInUsersLiked && !userIdInUsersDisliked) {
                    sauce.likes = usersLikedTab.push(sauceObject.userId);
                    console.log("Like ajouté !")
                  } else {
                    console.log("Erreur serveur")
                  }
                break;
                case 0:
                  if (userIdInUsersLiked && !userIdInUsersDisliked) {
                    var indiceLike = usersLikedTab.indexOf(sauceObject.userId);
                    usersLikedTab.splice(indiceLike,1);
                    sauce.likes -= 1;
                    console.log("Like supprimé !")
                  } else if (!userIdInUsersLiked && userIdInUsersDisliked) {
                    var indiceDislike = usersDislikedTab.indexOf(sauceObject.userId);
                    usersDislikedTab.splice(indiceDislike,1);
                    sauce.dislikes -= 1;
                    console.log("Dislike supprimé !")
                  } else {
                    console.log("Erreur serveur")
                  }
                break;
                case -1:
                  if (!userIdInUsersLiked && !userIdInUsersDisliked) {
                    sauce.dislikes = usersDislikedTab.push(sauceObject.userId);
                    console.log("Dislike ajouté !")
                  } else {
                    console.log("Erreur serveur")
                  }
                break;
              }
              Sauce.updateOne(
                { _id: req.params.id}, 
                { likes: sauce.likes, dislikes: sauce.dislikes, usersLiked: usersLikedTab, usersDisliked: usersDislikedTab, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Sauce likée!'}))
              .catch(error => res.status(401).json({ error }));
            })
            .catch( error => {
              res.status(500).json({ error });
            });  
          }
        }
        