const watchList = require('../models/watchList');
const model = require('../models/user');
const bcrypt = require('bcrypt');
const Connection = require('../models/connection');
const mongoose = require('mongoose');

exports.new = (req, res)=>{
    res.render('./user/new');
};

exports.create = (req, res, next)=>{
    let user = new model(req.body);
    user.save()
    .then(user=> {
        req.flash('success', 'You have successfully registered');
        res.redirect('/users/login');
    })
    .catch(err=>{
        if(err.name === 'ValidationError' ) {
            req.flash('error', err.message);  
            return res.redirect('/users/new');
        }

        if(err.code === 11000) {
            req.flash('error', 'Email has been used');  
            return res.redirect('/users/new');
        }
        
        next(err);
    }); 
};

exports.getUserLogin = (req, res, next) => {
    res.render('./user/login');
}

exports.login = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password;

    model.findOne({ email: email })
    .then(user => {
        if (!user) {
            req.flash('error', 'Wrong email address');  
            res.redirect('/users/login');
        } else {
            user.comparePassword(password)
            .then(result=>{
                if(result) {
                    req.session.user = user._id;
                    req.session.firstName = user.firstName;
                    req.session.lastName = user.lastName;
                    req.flash('success', 'You have successfully logged in');
                    res.redirect('/users/profile');
                } else {
                    req.flash('error', 'Wrong password');      
                    res.redirect('/users/login');
                }
            })
            .catch(err => next(err));;     
        }     
    })
    .catch(err => next(err));
};

exports.profile = (req, res, next) => {
    let id = req.session.user;
   
  
    let pendingConnectionIds = [];
    Connection
      .find({ host: id, status: 'Offer Pending' })
      .then((pendingConnections) => {
        return (pendingConnectionIds = pendingConnections.map((pt) => pt._id.toString()));
      }) 
      .then(async (response) => {
        console.log("found")
        const results = await Promise.all([
          model.findById(id),
          Connection.find({ host: id }),
          watchList.find({ user: id }).populate('connection'),
          Connection.find({ connectionWith: { $in: response } }),
        ]);
        const [user, connections, watchLists, myOffers] = results;
        res.render('./user/profile', { user, connections, watchLists, myOffers });
      })
      .catch((err) => next(err));
  };
  exports.connections = (req, res, next) => {
    let itemToConnection = { id: req.params.id };
    let id = req.session.user;
    Promise.all([model.findById(id), Connection.find({ host: id, status: 'Available' })])
      .then((results) => {
        const [user, connections] = results;
        console.log("second", connections);
        res.render('./user/connection', { user, connections, itemToConnection });
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  };
  
  exports.offer = (req, res, next) => {
    let connectionId = req.params.id;
    Connection
      .findOne({ connectionWith: connectionId })
      .then(async (othersConnection) => {
        Connection
          .findById(othersConnection.connectionWith)
          .then((ownConnection) => {
            res.render('./user/offer', { ownConnection, othersConnection });
          })
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  };
  
  // manage your own offer
  exports.ownoffer = (req, res, next) => {
    let connectionId = req.params.id;
    Connection
      .findById(connectionId)
      .then(async (ownConnection) => {
        Connection
          .findById(ownConnection.connectionWith)
          .then((othersConnection) => {
            res.render('./user/offer', { othersConnection, ownConnection });
          })
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  };
  
  exports.cancelOffer = (req, res, next) => {
    let connectionIds = req.params.id.split('&');
    let othersConnectionId = connectionIds[0];
    let ownConnectionId = connectionIds[1];
  
    Connection
      .findByIdAndUpdate(
        othersConnectionId,
        {
          $unset: {
            connectionWith: '',
          },
          $set: {
            status: 'Available',
          },
        },
        { useFindAndModify: false, runValidators: true }
      )
      .then((result) => {
        if (result) {
          Connection
            .findByIdAndUpdate(
              ownConnectionId,
              {
                $unset: {
                  connectionWith: '',
                },
                $set: {
                  status: 'Available',
                },
              },
              { useFindAndModify: false, runValidators: true }
            )
            .then((x) => {
              req.flash('success', 'Cancelled Offer Successfully');
              res.redirect('/users/profile');
            });
        } else {
          req.flash('Failure', 'Cancel Offer Failed');
          res.redirect('back');
        }
      })
      .catch((err) => next(err));
  };
  
  exports.acceptOffer = (req, res, next) => {
    let connectionIds = req.params.id.split('&');
    let othersConnectionId = connectionIds[0];
    let ownConnectionId = connectionIds[1];
  
    Connection
      .findByIdAndUpdate(
        othersConnectionId,
        {
          $unset: {
            connectionWith: '',
          },
          $set: {
              status: 'Traded',
          },
        },
        { useFindAndModify: false, runValidators: true }
      )
      .then((result) => {
        if (result) {
          Connection
            .findByIdAndUpdate(
              ownConnectionId,
              {
                $unset: {
                  connectionWith: '',
                },
                $set: {
                  status: 'Traded',
                },
              },
              { useFindAndModify: false, runValidators: true }
            )
            .then((x) => {
              req.flash('success', 'Accepted Offer Successfully');
              res.redirect('/users/profile');
            });
        } else {
          req.flash('Failure', 'Accept Offer Failed');
          res.redirect('back');
        }
      })
      .catch((err) => next(err));
  };


exports.logout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
 };



