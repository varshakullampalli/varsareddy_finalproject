const Connection = require('../models/connection');
const { DateTime } = require("luxon");
const watchList = require('../models/watchList');

exports.index = (req, res, next) => {
    let categories = [];
    Connection.distinct("topic", function(error, results){
        categories = results;
    });
    Connection.find()
    .then(connections => res.render('./connection/index', {connections, categories}))
    .catch(err=>next(err));
};

exports.new = (req, res) => {
    res.render('./connection/new');
};

exports.create = (req, res, next) => {
    let connection = new Connection(req.body);//created a new connection doc
    connection.host = req.session.user;
    connection.status = "Available";
    connection.save()//inserted a doc to the database
    .then(connection=> {
        req.flash('success', 'You have successfully created a new connection');
        res.redirect('/connections');
    })
    .catch(err=>{
        if(err.name === 'ValidationError'){
            req.flash('error', err.message);
            res.redirect('back');
        }else{
            next(err);
        }
    });
};

exports.show = (req, res, next) => {
    let id = req.params.id;
    Connection.findById(id).populate('host', 'firstName lastName')
    .then(connection=>{
        if(connection) {
            connection.date = DateTime.fromSQL(connection.date).toFormat('LLLL dd, yyyy');
            connection.startTime = DateTime.fromSQL(connection.startTime).toFormat('hh:mm a');
            connection.endTime = DateTime.fromSQL(connection.endTime).toFormat('hh:mm a');
            return res.render('./connection/show', {connection});
        } else {
            let err = new Error('Cannot find a connection with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err=>next(err));
};

exports.edit = (req, res, next) => {
    let id = req.params.id;
    Connection.findById(id)
    .then(connection=>{
        if(connection) {
            return res.render('./connection/edit', {connection});
        } else {
            let err = new Error('Cannot find a connection with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err=>next(err));
};

exports.update = (req, res, next) => {
    let connection = req.body;
    let id = req.params.id;
    Connection.findByIdAndUpdate(id, connection, {useFindAndModify: false, runValidators: true})
    .then(connection=>{
        if(connection) {
            req.flash('success', 'Connection has been successfully updated');
            res.redirect('/connections/'+id);
        } else {
            let err = new Error('Cannot find a connection with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err=> {
        if(err.name === 'ValidationError'){
            req.flash('error', err.message);
            res.redirect('back');
        }else{
            next(err);
        }
    });
};

exports.delete = (req, res, next) => {
    let id = req.params.id;
    Connection.findByIdAndDelete(id, {useFindAndModify: false})
    .then(connection =>{
        if(connection) {
            res.redirect('/connections');
        } else {
            let err = new Error('Cannot find a connection with id ' + id);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err=>next(err));
};
exports.watchList = (req, res, next) => {
    let requestUser = req.session.user;
    let id = req.params.id;
    watchList
      .find({ user: requestUser, connection: id })
      .then((watch) => {
        console.log('found1')
        if (watch.length) {
          req.flash('error', 'trade is already added to watchlist');
          res.redirect('back');
        } else {
          let watch = new watchList();
          watch.user = requestUser;
          watch.connection = id;
          watch
            .save()
            .then((watch) => {
              if (watch) {
                req.flash('success', 'Successfully added to watchList for this trade!');
                res.redirect('/users/profile');
              } else {
                req.flash('error', 'There was an error');
              }
            })
            .catch((err) => {
              if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('back');
              } else {
                next(err);
              }
            });
        }
      })
      .catch((err) => next(err));
  };
  
  exports.deletewatchList = (req, res, next) => {
    let id = req.params.id;
    watchList
      .findOneAndDelete({ user: req.session.user, connection: id })
      .then((watchList) => {
        if (watchList) {
          req.flash('success', 'trade has been sucessfully removed from watchlist!');
          res.redirect('/users/profile');
        } else {
          let err = new Error('Cannot find an watchList with id ' + id);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  };
  
  exports.updateStatus = (req, res, next) => {
    let ownItem = req.body;
    // others item
    let otherItemsId = req.params.id;
    let connectingUser = req.session.user;
  
    Promise.all([Connection.findById(ownItem.connection), Connection.findById(otherItemsId)])
      .then((results) => {
        const [ownItem, otherItem] = results;
        ownItem.status = 'Offer Pending';
        ownItem.save();
  
        otherItem.status = 'Offer Pending';
        otherItem.connectionWith = ownItem._id;
        otherItem.save();
        res.redirect('/users/profile');
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  };