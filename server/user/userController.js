var Q = require('q');
var jwt = require('jwt-simple');
var User = require('./userModel.js');
var Grid = require('gridfs-stream');

var mongoose = require('mongoose');
Grid.mongo = mongoose.mongo;
var gfs = Grid(mongoose.connection);


// Promisify a few mongoose methods with the `q` promise library
var findUser = Q.nbind(User.findOne, User);
var findTutors = Q.nbind(User.find, User);
var createUser = Q.nbind(User.create, User);
var updateUser = Q.nbind(User.findOneAndUpdate, User);

module.exports = {

  //temporary testing controller
  getAllTutors: function(req, res, nex) {
    User.find({isTutor: true}, function(err, users) {
      res.send(users);  
    });
  },

  getTutor: function(req, res, nex) {
    User.find({username: req.params.username}, function(err, user) {
      res.send(user);
    });

    // extract image link
    // send image back with POST??
    // read image from user.imageLink...

    //write content to file system
        // var fs_write_stream = fs.createWriteStream('write.txt');
         
        // //read from mongodb
        // var readstream = gfs.createReadStream({
        //  filename: 'mongo_file.txt'
        // });
        // readstream.pipe(fs_write_stream);
        // fs_write_stream.on('close', function () {
        //  console.log('file has been written fully!');
        // });

        //another implementation
        // var readstream = gridfs.createReadStream({
        //   _id: req.params.fileId
        // });
        // req.on('error', function(err) {
        //   res.send(500, err);
        // });
        // readstream.on('error', function (err) {
        //   res.send(500, err);
        // });
        // readstream.pipe(res);

  },

  findTutor: function(req, res, nex) {
    findUser({name: req.params.name, isTutor: true})
      .then(function(tutor) {
        if (!tutor) {
          next( new Error('Invalid tutor'));
        } else {
          res.send(tutor); 
        }
      });
  },

  search: function (req, res, next) {
    var city = req.query.city;
    var subjects = req.query.subjects;

    console.log('Request queries: ', req.query);

    var subjectsArr = subjects.split(',');

    console.log('subjectsArr: ', subjectsArr);

    findTutors({'location.city': city, 'subjects': { $in: subjectsArr }, 'isTutor': true })
    .then(function(users) {
      res.status(200).send(users);
    })
    .catch(function(err) {
      res.status(500);
      console.log ('Error: ', err);
    });
  },

  saveProfile: function(req, res) {
    updateUser({username: req.body.username}, req.body, {new: true}, function(err, doc) {
      if (!err) {
        res.send(doc);
      }
    });
  },

  saveProfilePic: function(req, res) {
    fs.readFile(req.files.profilePic.path, function (err, data) {
      // ...
      var newPath = __dirname + "/uploads/uploadedFileName";
      fs.writeFile(newPath, data, function (err) {
        res.redirect("back");
      });
    });
  },

  signin: function (req, res, next) {
    var email = req.body.email;
    var password = req.body.password;

    findUser({email: email})
      .then(function (user) {
        if (!user) {
          next(new Error('User does not exist'));
        } else {
          return user.comparePasswords(password)
            .then(function (foundUser) {
              if (foundUser) {
                var token = jwt.encode(user, 'secret');
                res.json({token: token});
              } else {
                return next(new Error('No user'));
              }
            });
        }
      })
      .fail(function (error) {
        next(error);
      });
  },

  signup: function (req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    var username = req.body.username;
    var isTutor = req.body.isTutor;
    var location = req.body.location;
    var subjects = req.body.subjects;

    // check to see if user already exists
    findUser({email: email})
      .then(function (user) {
        if (user) {
          next(new Error('User already exist!'));
        } else {
          // make a new user if not one
          return createUser({
            username: username,
            email: email,
            password: password,
            isTutor: isTutor,
            location: location,
            subjects: subjects
          });
        }
      })
      .then(function (user) {
        // create token to send back for auth
        var token = jwt.encode(user, 'secret');
        res.json({token: token});
      })
      .fail(function (error) {
        next(error);
      });
  },

  checkAuth: function (req, res, next) {
    // checking to see if the user is authenticated
    // grab the token in the header is any
    // then decode the token, which we end up being the user object
    // check to see if that user exists in the database
    var token = req.headers['x-access-token'];
    if (!token) {
      next(new Error('No token'));
    } else {
      var user = jwt.decode(token, 'secret');
      findUser({email: user.email})
        .then(function (foundUser) {
          if (foundUser) {
            res.send(200);
          } else {
            res.send(401);
          }
        })
        .fail(function (error) {
          next(error);
        });
    }
  }
};
