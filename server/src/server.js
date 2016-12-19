// Imports the express Node module.
var express = require('express');
// Creates an Express server.
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
// Support receiving JSON in HTTP request bodies
var mongo_express = require('mongo-express/lib/middleware');
// Import the default Mongo Express configuration
var mongo_express_config = require('mongo-express/config.default.js');

var MongoDB = require('mongodb');
var MongoClient = MongoDB.MongoClient;
var ObjectID = MongoDB.ObjectID;
var url = 'mongodb://localhost:27017/Upao';
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var secretKey = `2f862fc1c64e437b86cef1373d3a3f8248ab4675220b3afab1c5ea97e
fda064351da14375118884b463b47a4c0699f67aed0094f339998f102d99bdfe479dbefae0
6933592c86abd20c5447a5f9af1b275c909de4108ae2256bcb0285daad0aa890171849fb3c
a332ca4da03fc80b9228f56cad935b6b9fd33ce6437a4b1f96648546a122a718720452b7cf
38acc120c64b4a1622399bd6984460e4f4387db1a164c6dd4c80993930c57444905f6b46e7
a7f1dba60f898302c4865cfee74b82517852e5bd5890a547d59071319b5dfc0faa92ce4f01
f090e49cab2422031b17ea54a7c4b660bf491d7b47343cdf6042918669d7df54e7d3a1be6e9a571be9aef`;

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));


MongoClient.connect(url, function(err, db) {
  // var moment = require('moment');
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(express.static('../client/build'));
  app.use('/mongo_express', mongo_express(mongo_express_config));

  if (err)
      console.log(err);
  else {
      console.log("connected to database")
  }

  //schemas
  var statusUpdateSchema = require('./schemas/statusUpdate.json');
  var commentSchema = require('./schemas/comment.json');
  var userInfoSchema = require('./schemas/userInfo.json');
  var emailChangeSchema = require('./schemas/emailChange.json');
  var activitySchema = require('./schemas/activity.json');
  var userSchema = require('./schemas/user.json');
  var loginSchema = require('./schemas/login.json');
  var validate = require('express-jsonschema').validate;

  function getAllPosts(callback){
    db.collection('postFeedItems').find().toArray(function(err,collection){
      if(err){
        return callback(err);
      }
      var resolvedPosts = [];

      function processNextFeedItem(i) {
        // Asynchronously resolve a feed item.
        resolvePostItem(collection[i], function(err, postItem) {
          if (err) {
            // Pass an error to the callback.
            callback(err);
          } else {
            // Success!
            resolvedPosts.push(postItem);
            if (resolvedPosts.length === collection.length) {
              // I am the final feed item; all others are resolved.
              // Pass the resolved feed document back to the callback.
              collection = resolvedPosts.reverse();
              callback(null, collection);
            } else {
              // Process the next feed item.
              processNextFeedItem(i + 1);
            }
          }
        });
      }

      if (collection.length === 0) {
        callback(null, collection);
      } else {
        processNextFeedItem(0);
      }


    });
  }


  //get post feed data
  function getPostFeedItem(feedItemId, callback) {
      db.collection('postFeedItems').findOne({
          _id: feedItemId
      }, function(err, postFeedItem) {
          if (err)
              callback(err);
          else if (postFeedItem === null) {
              callback(null, null);
          } else {
            resolvePostItem(postFeedItem,callback);
          }
      });
  }

  function getPostFeedData(user, callback) {
      db.collection('users').findOne({
          _id: user
      }, function(err, userData) {
          if (err) {
              return callback(err);
          } else if (userData === null) {
              // User not found.
              return callback(null, null);
          }

          db.collection('postFeeds').findOne({
              _id: userData.post
          }, function(err, feedData) {
              if (err) {
                  return callback(err);
              } else if (feedData === null) {
                  // Feed not found.
                  return callback(null, null);
              }

              // We will place all of the resolved FeedItems here.
              // When done, we will put them into the Feed object
              // and send the Feed to the client.
              var resolvedContents = [];

              // processNextFeedItem is like an asynchronous for loop:
              // It performs processing on one feed item, and then triggers
              // processing the next item once the first one completes.
              // When all of the feed items are processed, it completes
              // a final action: Sending the response to the client.
              function processNextFeedItem(i) {
                  // Asynchronously resolve a feed item.
                  getPostFeedItem(feedData.contents[i], function(err, feedItem) {
                      if (err) {
                          // Pass an error to the callback.
                          callback(err);
                      } else {
                          // Success!
                          resolvedContents.push(feedItem);
                          if (resolvedContents.length === feedData.contents.length) {
                              // I am the final feed item; all others are resolved.
                              // Pass the resolved feed document back to the callback.
                              feedData.contents = resolvedContents;
                              callback(null, feedData);
                          } else {
                              // Process the next feed item.
                              processNextFeedItem(i + 1);
                          }
                      }
                  });
              }

              // Special case: Feed is empty.
              if (feedData.contents.length === 0) {
                  callback(null, feedData);
              } else {
                  processNextFeedItem(0);
              }
          });
      });
  }

  // function getPostFeedData(user){
  //   var userData = readDocument('users',user);
  //   var feedData = readDocument('postFeeds',userData.post);
  //   feedData.contents = feedData.contents.map(getPostFeedItemSync);
  //   return feedData;
  // }

  app.get('/user/:userId/feed', function(req, res) {
      var userId = req.params.userId;
      // var fromUser = getUserIdFromToken(req.get('Authorization'));
      // if(userId === fromUser){
      getPostFeedData(new ObjectID(userId), function(err, feedData) {
          if (err)
              sendDatabaseError(res, err);
          else if (feedData === null) {
              res.status(400);
              res.send("Could not look up feed for user " + userId);
          } else {
              res.send(feedData);
          }
      });
      // }
      // else{
      // res.status(401).end();
      // }
  });

  function postStatus(user, text, location, img, callback) {
      var time = new Date().getTime();

      var post = {
          "likeCounter": [],
          "type": "general",
          "contents": {
              "author": user,
              "postDate": time,
              "text": text,
              "img": img,
              "location": location
          },
          "comments": []
      };
      db.collection('postFeedItems').insertOne(post, function(err, result) {
          if (err)
              callback(err);
          else {
              post._id = result.insertedId;
              db.collection("users").findOne({
                  _id: user
              }, function(err, userData) {
                  if (err)
                      callback(err);
                  else {
                      db.collection('postFeeds').updateOne({
                          _id: userData.post
                      }, {
                          $push: {
                              contents: {
                                  $each: [post._id],
                                  $position: 0
                              }
                          }
                      }, function(err) {
                          if (err)
                              callback(err);
                          else {
                              callback(null, post);
                          }
                      });
                  }
              });
          }
      });
  }
  //create post
  app.post('/postItem', validate({body: statusUpdateSchema}), function(req, res) {
      var body = req.body;
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      if (fromUser === body.userId) {
          postStatus(new ObjectID(body.userId), body.text, body.location, body.img, function(err, newPost) {
              if (err)
                  sendDatabaseError(res, err);
              else {
                  res.status(201);
                  res.send(newPost);
              }
          });
      } else {
          res.status(401).end();
      }
  });

  //like post
  app.put('/postItem/:postItemId/likelist/:userId', function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var postItemId = req.params.postItemId;
      var userId = req.params.userId;

      if (userId === fromUser) {
          db.collection('postFeedItems').updateOne({
              _id: new ObjectID(postItemId)
          }, {
              $addToSet: {
                  likeCounter: new ObjectID(userId)
              }
          }, function(err) {
              if (err)
                  sendDatabaseError(res, err);
              else {
                  getPostFeedItem(new ObjectID(postItemId), function(err, postItem) {
                      if (err)
                          sendDatabaseError(res, err);
                      else {
                          res.send(postItem.likeCounter);
                      }
                  })
              }
          });
      } else {
          res.status(401).end();
      }
  });

  //unlike post
  app.delete('/postItem/:postItemId/likelist/:userId', function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var postItemId = req.params.postItemId;
      var userId = req.params.userId;
      if (userId === fromUser) {
          db.collection("postFeedItems").updateOne({
              _id: new ObjectID(postItemId)
          }, {
              $pull: {
                  likeCounter: new ObjectID(userId)
              }
          }, function(err) {
              if (err)
                  sendDatabaseError(res, err);
              else {
                  getPostFeedItem(new ObjectID(postItemId), function(err, postItem) {
                      if (err)
                          sendDatabaseError(res, err);
                      else {
                          res.send(postItem.likeCounter);
                      }
                  })
              }
          });
      } else {
          res.status(401).end();
      }
  });

  function resolveUserObjects(userList, callback) {
      // Special case: userList is empty.
      // It would be invalid to query the database with a logical OR
      // query with an empty array.
      if (userList.length === 0) {
          callback(null, {});
      } else {
          // Build up a MongoDB "OR" query to resolve all of the user objects
          // in the userList.
          var query = {
              $or: userList.map((id) => {
                  return {_id: id}
              })
          };
          // Resolve 'like' counter
          db.collection('users').find(query).toArray(function(err, users) {
              if (err) {
                  return callback(err);
              }
              // Build a map from ID to user object.
              // (so userMap["4"] will give the user with ID 4)
              var userMap = {};
              users.forEach((user) => {
                  delete user.password;
                  delete user.sessions;
                  delete user.friends;
                  delete user.post;
                  delete user.notification;
                  delete user.activity;
                  userMap[user._id] = user;
              });
              callback(null, userMap);
          });
      }
  }

  function resolveSessionObject(sessionList, callback) {
      if (sessionList.length === 0) {
          callback(null, {});
      } else {
          var query = {
              $or: sessionList.map((id) => {
                  return {_id: id}
              })
          };
          // Resolve 'like' counter
          db.collection('messageSession').find(query).toArray(function(err, sessions) {
              if (err) {
                  return callback(err);
              }
              // Build a map from ID to user object.
              // (so userMap["4"] will give the user with ID 4)
              var sessionMap = {};
              sessions.forEach((session) => {
                  sessionMap[session._id] = session;
              });
              callback(null, sessionMap);
          });
      }
  }

  /**
   * Helper function: Sends back HTTP response with error code 500 due to
   * a database error.
   */
  function sendDatabaseError(res, err) {
      res.status(500).send("A database error occurred: " + err);
  }

  function getUserData(userId, callback) {
      db.collection('users').findOne({
          _id: userId
      }, function(err, userData) {
          if (err)
              callback(err);
          else {
              resolveUserObjects(userData.friends, function(err, userMap) {
                  if (err)
                      callback(err);
                  else {
                      userData.friends = userData.friends.map((id) => userMap[id]);
                    resolveSessionObject(userData.sessions, function(err, sessionMap) {
                          if (err)
                              callback(err);
                          else {
                              userData.sessions = userData.sessions.map((id) => sessionMap[id]);
                              delete userData.password;
                              callback(null, userData);
                          }
                      });
                  }
              });
          }
      });
  }

  app.get('/chatNotification/:userid',function(req,res){
    var userid = req.params.userid;
    getUserData(new ObjectID(userid),function(err,userdata){
      if(err)
      sendDatabaseError(res,err);
      else {

        res.send(userdata.sessions);
      }
    })
  })

  //get user data
  app.get('/user/:userId', function(req, res) {
      var userId = req.params.userId;
      getUserData(new ObjectID(userId), function(err, userData) {
          if (err)
              return sendDatabaseError(res, err);
          res.send(userData);
      });
  });

  //post comments
  app.post('/postItem/:postItemId/commentThread/comment', validate({body: commentSchema}), function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var body = req.body;
      var postItemId = req.params.postItemId;
      var userId = body.author;
      if (fromUser === userId) {
          db.collection('postFeedItems').updateOne({
              _id: new ObjectID(postItemId)
          }, {
              $push: {
                  comments: {
                      "author": new ObjectID(userId),
                      "text": body.text,
                      "postDate": (new Date()).getTime()
                  }
              }
          }, function(err) {
              if (err)
                  sendDatabaseError(res.err);
              else {
                  getPostFeedItem(new ObjectID(postItemId), function(err, postItem) {
                      if (err)
                          sendDatabaseError(res, err);
                      else {
                          res.send(postItem);
                      }
                  });
              }
          });
      } else {
          res.status(401).end();
      }
  });

  //change user info
  app.put('/settings/user/:userId', validate({body: userInfoSchema}), function(req, res) {
      var data = req.body;
      var moment = require('moment');
      var userId = new ObjectID(req.params.userId);
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      if (fromUser.str === userId.str) {
          db.collection('users').updateOne({
              _id: userId
          }, {
              $set: {
                  fullname:data.fullname,
                  nickname: data.nickname,
                  description: data.description,
                  location: data.location,
                  birthday: moment(data.birthday).valueOf()
              }
          }, function(err) {
              if (err)
                  return sendDatabaseError(res, err);
              getUserData(userId, function(err, userData) {
                  if (err)
                      return sendDatabaseError(res, err);
                  res.send(userData);
              });
          });
      } else {
          res.status(401).end();
      }
  });

  function getActivityFeedItem(activityId, callback) {
      db.collection('activityItems').findOne({
          _id: activityId
      }, function(err, activityItem) {
          if (err)
              return callback(err);

          resolveActivityItem(activityItem,callback);

      });
  }

  function resolveActivityItem(activityItem,callback){
    var userList = [activityItem.author];
    activityItem.comments.forEach((comment) => {
        userList.push(comment.author);
    });
    activityItem.likeCounter.map((id) => userList.push(id));
    activityItem.participants.map((id) => userList.push(id));
    resolveUserObjects(userList, function(err, userMap) {
        if (err)
            return callback(err);

        activityItem.author = userMap[activityItem.author];
        activityItem.participants = activityItem.participants.map((id) => userMap[id]);
        activityItem.likeCounter = activityItem.likeCounter.map((id) => userMap[id]);
        activityItem.comments.forEach((comment) => {
            comment.author = userMap[comment.author];
        });

        callback(null, activityItem);
    });
  }

  function resolvePostItem(postFeedItem,callback){
    var userList = [postFeedItem.contents.author];
    postFeedItem.comments.forEach((comment) => {
        userList.push(comment.author);
    });
    userList = userList.concat(postFeedItem.likeCounter);

    resolveUserObjects(userList, function(err, userMap) {
        if (err)
            callback(err);
        else {
            postFeedItem.likeCounter = postFeedItem.likeCounter.map((id) => userMap[id]);
            postFeedItem.contents.author = userMap[postFeedItem.contents.author];
            postFeedItem.comments.forEach((comment) => {
                comment.author = userMap[comment.author];
            });
            callback(null, postFeedItem);
        }
    });
  }

  function getAllActivities(callback){
    db.collection('activityItems').find().toArray(function(err,collection){
      if(err){
        return callback(err);
      }
      var resolvedActivities = [];

      function processNextFeedItem(i) {
        // Asynchronously resolve a feed item.
        resolveActivityItem(collection[i], function(err, activityItem) {
          if (err) {
            // Pass an error to the callback.
            callback(err);
          } else {
            // Success!
            resolvedActivities.push(activityItem);
            if (resolvedActivities.length === collection.length) {
              // I am the final feed item; all others are resolved.
              // Pass the resolved feed document back to the callback.
              collection = resolvedActivities.reverse();
              callback(null, collection);
            } else {
              // Process the next feed item.
              processNextFeedItem(i + 1);
            }
          }
        });
      }

      if (collection.length === 0) {
        callback(null, collection);
      } else {
        processNextFeedItem(0);
      }


    });
  }

  app.get('/user/:userId/activities',function(req,res){
    var userId = req.params.userId;
    var fromUser = getUserIdFromToken(req.get('Authorization'));
    if(userId === fromUser){
      getAllActivities(function(err, activityData) {
        if (err)
        sendDatabaseError(res, err);
        else {
          res.send(activityData);
        }
      });
    }
    else{
      res.status(401).end();
    }
  });
  app.get('/user/:userId/posts',function(req,res){
    var userId = req.params.userId;
    var fromUser = getUserIdFromToken(req.get('Authorization'));
    if(userId === fromUser){
      getAllPosts(function(err, postData) {
        if (err)
        sendDatabaseError(res, err);
        else {
          res.send(postData);
        }
      });
    }
    else{
      res.status(401).end();
    }
  });

  function getActivityFeedData(userId, callback) {
      db.collection('users').findOne({
          _id: userId
      }, function(err, userData) {
          if (err)
              return callback(err);
          else if (userData === null)
              return callback(null, null);
          else {
              db.collection('activities').findOne({
                  _id: userData.activity
              }, function(err, activity) {
                  if (err)
                      return callback(err);
                  else if (activity === null)
                      return callback(null, null);

                  var resolvedContents = [];

                  function processNextFeedItem(i) {
                      // Asynchronously resolve a feed item.
                      getActivityFeedItem(activity.contents[i], function(err, feedItem) {
                          if (err) {
                              // Pass an error to the callback.
                              callback(err);
                          } else {
                              // Success!
                              resolvedContents.push(feedItem);
                              if (resolvedContents.length === activity.contents.length) {
                                  // I am the final feed item; all others are resolved.
                                  // Pass the resolved feed document back to the callback.
                                  activity.contents = resolvedContents;
                                  callback(null, activity);
                              } else {
                                  // Process the next feed item.
                                  processNextFeedItem(i + 1);
                              }
                          }
                      });
                  }

                  if (activity.contents.length === 0) {
                      callback(null, activity);
                  } else {
                      processNextFeedItem(0);
                  }
              });
          }
      });
  }

  function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
  }

  app.put('/settings/emailChange/user/:userId', validate({body: emailChangeSchema}), function(req, res) {
      var data = req.body;
      var userId = new ObjectID(req.params.userId);
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      if (fromUser.str === userId.str) {
          getUserData(userId, function(err, userData) {
              if (err)
                  return sendDatabaseError(res, err);
              else if (userData.email === data.oldEmail && validateEmail(data.newEmail)) {
                  db.collection('users').updateOne({
                      _id: userId
                  }, {
                      $set: {
                          email: data.newEmail
                      }
                  }, function(err) {
                      if (err)
                          return sendDatabaseError(res, err);
                      else {
                          res.send(false);
                      }
                  });
              } else {
                  res.send(true);
              }
          });
      } else {
          res.statsus(401).end();
      }
  });

  app.put('/settings/avatar/user/:userId', function(req, res) {
      var userId = new ObjectID(req.params.userId);
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      var body = req.body;
      if (fromUser.str === userId.str) {
          db.collection('users').findAndModify({
              _id: userId
          }, [
              ['_id', 'asc']
          ], {
              $set: {
                  avatar: body.img
              }
          }, {
              "new": true
          }, function(err, result) {
              if (err)
                  return sendDatabaseError(res, err);
              else {
                  res.send(result.value);
              }
          });
      } else {
          res.status(401).end();
      }
  });

  app.put('/settings/location/user/:userId', function(req, res) {
      var userId = req.params.userId;
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var body = req.body;
      if (fromUser === userId) {
          db.collection('users').updateOne({
              _id: new ObjectID(userId)
          }, {
              $set: {
                  location: body
              }
          }, function(err) {
              if (err)
                  return sendDatabaseError(res, err);
              else {
                  res.send(true);
              }
          });
      }
  });

  // get activity Feed data
  app.get('/user/:userid/activity', function(req, res) {
      var userId = new ObjectID(req.params.userid);
      // var fromUser = getUserIdFromToken(req.get('Authorization'));
      // if(userId === fromUser){
      getActivityFeedData(userId, function(err, activityData) {
          if (err)
              sendDatabaseError(res, err);
          else {
              res.send(activityData);
          }
      });
      // }
      // else{
      // res.status(401).end();
      // }
  });

  function postActivity(data,callback) {
      data.participants=[];
      data.likeCounter=[];
      data.comments=[];
      data.author = new ObjectID(data.author);
      delete data.cropperOpen;
      db.collection('activityItems').insertOne(data,function(err,result){
        if(err)
          return callback(err);
        else{
          data._id=result.insertedId;
          db.collection('users').findOne({_id:new ObjectID(data.author)},function(err,userData){
            if(err)
              return callback(err);
            else{
              db.collection('activities').updateOne({_id:userData.activity},{
                $push: {
                  contents: {
                    $each: [data._id],
                    $position: 0
                  }
                }
              },function(err){
                if(err)
                callback(err);
                else{
                  callback(null,data);
                }
              });
            }
          });
        }
      });
  }
  //post activity
  app.post('/postActivity', validate({body: activitySchema}), function(req, res) {
      var body = req.body;
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      if (fromUser === body.author) {
        postActivity(body,function(err,activityData){
          if(err)
            return sendDatabaseError(res,err);
          else{
            res.send(activityData);
          }
        });
      } else {
          res.status(401).end();
      }
  });

  //get activity detail
  app.get('/activityItem/:activityId', function(req, res) {
      var activityId = new ObjectID(req.params.activityId);
      getActivityFeedItem(activityId, function(err, activityData) {
          res.status(201);
          res.send(activityData);
      });
  });

  //like activity
  app.put('/activityItem/:activityId/likelist/:userId', function(req, res) {
      // var fromUser = getUserIdFromToken(req.get('Authorization'));
      var activityId = new ObjectID(req.params.activityId);
      var userId = req.params.userId;
      // if (userId === fromUser) {
          var update = {
              $addToSet: {}
          };
          update.$addToSet["likeCounter"] = new ObjectID(userId);
          db.collection('activityItems').findAndModify({
              _id: activityId
          }, [
              ['_id', 'asc']
          ], update, {
              "new": true
          }, function(err, result) {
              if (err) {
                  return sendDatabaseError(res, err);
              } else if (result.value === null) {
                  // Filter didn't match anything: Bad request.
                  res.status(400).end();
              } else {
                  resolveUserObjects(result.value.likeCounter, function(err, userMap) {
                      if (err) {
                          sendDatabaseError(res, err);
                      } else {
                          result.value.likeCounter = result.value.likeCounter.map((id) => userMap[id]);
                          res.send(result.value.likeCounter);
                      }
                  });
              }
          });
      // } else {
      //     // Unauthorized.
      //     res.status(401).end();
      // }
  });

  //unlike activity
  app.delete('/activityItem/:activityId/likelist/:userId', function(req, res) {
      // var fromUser = getUserIdFromToken(req.get('Authorization'));
      var activityId = new ObjectID(req.params.activityId);
      var userId = req.params.userId;
      // if (userId === fromUser) {
          var update = {
              $pull: {}
          };
          update.$pull["likeCounter"] = new ObjectID(userId);
          db.collection('activityItems').findAndModify({
              _id: activityId
          }, [
              ['_id', 'asc']
          ], update, {
              "new": true
          }, function(err, result) {
              if (err) {
                  return sendDatabaseError(res, err);
              } else if (result.value === null) {
                  // Filter didn't match anything: Bad request.
                  res.status(400).end();
              } else {
                  resolveUserObjects(result.value.likeCounter, function(err, userMap) {
                      if (err) {
                          sendDatabaseError(res, err);
                      } else {
                          result.value.likeCounter = result.value.likeCounter.map((id) => userMap[id]);
                          res.send(result.value.likeCounter);
                      }
                  });
              }
          });
      // } else {
      //     // Unauthorized.
      //     res.status(401).end();
      // }
  });

  //post ADcomments
  app.post('/activityItem/:activityId/commentThread/comment', validate({body: commentSchema}), function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var body = req.body;
      var activityItemId = new ObjectID(req.params.activityId);
      var userId = body.author;
      if (fromUser === userId) {
          db.collection('activityItems').updateOne({
              _id: activityItemId
          }, {
              $push: {
                  comments: {
                      "author": new ObjectID(userId),
                      "postDate": (new Date()).getTime(),
                      "text": body.text
                  }
              }
          }, function(err) {
              if (err) {
                  sendDatabaseError(res.err);
              } else {
                  getActivityFeedItem(activityItemId, function(err, activityData) {
                      if (err) {
                          sendDatabaseError(res, err);
                      } else {
                          res.send(activityData);
                      }
                  });
              }
          });
      } else {
          res.status(401).end();
      }
  });

  function getNotificationItem(notificationId, callback) {
      db.collection('notificationItems').findOne({
          _id: notificationId
      }, function(err, notification) {
          if (err)
              return callback(err);
          else if (notification === null)
              return callback(null, null);
          else {
            var userList = [notification.sender,notification.target];
            resolveUserObjects(userList,function(err,userMap){
              if(err)
              callback(err);
              else{
                notification.sender = userMap[notification.sender];
                notification.target = userMap[notification.target];
                callback(null,notification)
              }
            });
          }
      });
  }

  function getNotificationData(notificationId, callback) {
      db.collection('notifications').findOne({
          _id: notificationId
      }, function(err, notifications) {
          if (err)
              return callback(err);

          var resolvedContents = [];

          function processNextFeedItem(i) {
              // Asynchronously resolve a feed item.
              getNotificationItem(notifications.contents[i], function(err, notification) {
                  if (err) {
                      // Pass an error to the callback.
                      callback(err);
                  } else {
                      // Success!
                      resolvedContents.push(notification);
                      if (resolvedContents.length === notifications.contents.length) {
                          // I am the final feed item; all others are resolved.
                          // Pass the resolved feed document back to the callback.
                          notifications.contents = resolvedContents;
                          callback(null, notifications);
                      } else {
                          // Process the next feed item.
                          processNextFeedItem(i + 1);
                      }
                  }
              });
          }

          if (notifications.contents.length === 0) {
              callback(null, notifications);
          } else {
              processNextFeedItem(0);
          }
      });
  }

  //get notification
  app.get('/user/:userId/notification', function(req, res) {
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      var userId = new ObjectID(req.params.userId);
      if (fromUser.str === userId.str) {
          db.collection('users').findOne({
              _id: userId
          }, function(err, userData) {
              if (err)
                  return sendDatabaseError(res, err);
              else if (userData === null)
                  return res.status(400).end();
              else {
                  getNotificationData(userData.notification, function(err, notificationData) {
                      if (err)
                          return sendDatabaseError(res, err);
                      res.send(notificationData);
                  });
              }
          });
      } else {
          res.status(401).end();
      }
  });

  function deleteNotification(notificationId, userId, callback) {
      db.collection('users').findOne({
          _id: userId
      }, function(err, userData) {
          if (err)
              callback(err);
          else if (userData === null)
              callback(null, null);
          else {
              db.collection('notifications').updateOne({
                  _id: userData.notification
              }, {
                  $pull: {
                      contents: notificationId
                  }
              }, function(err) {
                  if (err)
                      return callback(err);
                  else {
                      db.collection('notificationItems').remove({
                          _id: notificationId
                      }, function(err) {
                          if (err)
                              return callback(err);
                          else {
                              getNotificationData(userData.notification, function(err, notificationData) {
                                  if (err)
                                      return callback(err);
                                  else {
                                      callback(null, notificationData);
                                  }
                              });
                          }
                      });
                  }
              });
          }
      });
  }

  //acceptRequest
  app.put('/notification/:notificationId/:userId', function(req, res) {
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      var userId = new ObjectID(req.params.userId);
      var notificationId = new ObjectID(req.params.notificationId);
      if (fromUser.str === userId.str) {
          getNotificationItem(notificationId, function(err, notification) {
              if (err)
                  return sendDatabaseError(res, err);
              else {
                  db.collection('users').updateOne({
                      _id: userId
                  }, {
                      $addToSet: {
                          friends: notification.sender._id
                      }
                  }, function(err) {
                      if (err)
                          return sendDatabaseError(res, err);
                      else {
                        db.collection('users').updateOne({
                            _id: notification.sender._id
                        }, {
                            $addToSet: {
                                friends: userId
                            }
                        }, function(err) {
                          if(err)
                            return sendDatabaseError(res,err);

                          deleteNotification(notificationId, userId, function(err, notificationData) {
                            if (err)
                            sendDatabaseError(res, err);
                            else {
                              res.send(notificationData);
                            }
                          });
                        });
                      }
                  })
              }
          });
      } else {
          res.status(401).end();
      }
  });

  //deleteNotification
  app.delete('/notification/:notificationId/:userId', function(req, res) {
      var fromUser = new ObjectID(getUserIdFromToken(req.get('Authorization')));
      var userId = new ObjectID(req.params.userId);
      var notificationId = new ObjectID(req.params.notificationId);
      if (fromUser.str === userId.str) {
          deleteNotification(notificationId, userId, function(err, notificationData) {
              if (err)
                  sendDatabaseError(res, err);
              else {
                  res.send(notificationData);
              }
          });
      } else {
          res.status(401).end();
      }
  });

  //getMessage
  app.get('/user/:userId/chatsession/:id', function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var id = req.params.id;
      var userid = req.params.userId;
      if (userid == fromUser) {
          db.collection('messageSession').findOne({
              _id: new ObjectID(id)
          }, function(err, message) {
              if (err)
                  sendDatabaseError(res, err);
              else {
                if(message.lastmessage===undefined?false:
                  (message.lastmessage.target===undefined?"":message.lastmessage.target.str===userid.str)){
                  db.collection('messageSession').updateOne({_id:new ObjectID(id)},{
                    $set:{
                      "lastmessage.isread":true
                    }
                  },function(err){
                    if(err)
                      return sendDatabaseError(res,err);
                      getMessage(message.contents, function(err, data) {
                        if (err)
                        sendDatabaseError(res, err);
                        else {
                          res.status(201);
                          res.send(data.messages);
                        }
                      });
                  })
                }
                else getMessage(message.contents, function(err, data) {
                  if (err)
                  sendDatabaseError(res, err);
                  else {
                    res.status(201);
                    res.send(data.messages);
                  }
                });

              }
          })
      }
  });

  //post message
  app.post('/user/:userid/chatsession/:id', function(req, res) {
    var fromUser = getUserIdFromToken(req.get('Authorization'));
    var id = req.params.id;
    var userid = req.params.userid;
    var body = req.body;
    if (userid === fromUser) {
        var senderid = body.sender;
        var targetid = body.target;
        var text = body.text;
        var lastmessage = {
            "sender": new ObjectID(senderid),
            "target": new ObjectID(targetid),
            "date": (new Date()).getTime(),
            "text": text
        }
        getSessionContentsID(new ObjectID(id), function(err, contentsid) {
            if (err)
                sendDatabaseError(res, err);
            else {
                db.collection('message').updateOne({
                    _id: new ObjectID(contentsid)
                }, {
                    $push: {
                        messages: lastmessage
                    }
                }, function(err) {
                    if (err)
                        sendDatabaseError(res.err);
                    else {
                        getMessage(contentsid, function(err, message) {
                            if (err)
                                sendDatabaseError(res, err);
                            else {
                                //seting lastmessage;
                                lastmessage.isread = false;
                                db.collection("messageSession").updateOne({
                                    _id: new ObjectID(id)
                                }, {
                                    $set: {
                                        "lastmessage": lastmessage
                                    }
                                }, function(err) {
                                    if (err)
                                        sendDatabaseError(res, err);

                                    else res.send(message.messages);
                                });
                            }
                        });
                    }
                })

            }
        });
    } else {
        res.status(401).end();
    }
});

function getMessage(sessionId, cb) {
  db.collection('message').findOne({
    _id: sessionId
  }, function(err, message) {
    if (err) {
      return cb(err);
    } else {
      if(message.messages.length===0){
        cb(null,message);
      }
      else{
        var userList = [message.messages[0].sender, message.messages[0].target];
        resolveUserObjects(userList, function(err, userMap) {
          if (err)
          return cb(err);
          message.messages.forEach((message) => {
            message.target = userMap[message.target];
            message.sender = userMap[message.sender];
          });
          cb(null, message);
        })
      }
    }
  }
)}

  app.get('/getsession/:userid/:targetid', function(req, res) {
      var fromUser = getUserIdFromToken(req.get('Authorization'));
      var userid = req.params.userid;
      if (userid == fromUser) {
          var targetid = req.params.targetid;
          getSession(new ObjectID(userid), new ObjectID(targetid), function(err, session) {
              if (err)
                  sendDatabaseError(res, err);
              else if(session===null){
                createSession(new ObjectID(userid), new ObjectID(targetid),function(err,newSession){
                  if(err)
                    sendDatabaseError(res,err);
                  else{
                    res.status(201);
                    res.send(newSession);
                  }
                })
              }
              else {
                  res.status(201);
                  res.send(session);
              }
          });
      } else {
          res.status(401).end();
      }
  });

  function getSession(userid, targetid, cb) {
      db.collection("messageSession").findOne({
          users: {
              $all: [userid, targetid]
          }
      }, function(err, session) {
          if (err)
              return cb(err);
          cb(null, session);
      })
  }

  function getSessionContentsID(sessionid, cb) {

      db.collection("messageSession").findOne({
              _id: sessionid
      }, function(err, session) {

          if (err){
              return cb(err);
            }
          cb(null, session.contents);
      })
  }

  function createSession(userid, targetid, cb){
    db.collection("message").insertOne({
      messages:[]
    },function(err,message){
      if(err)
        cb(err);
      else{
        var newSession = {
          users : [userid, targetid],
          contents: message.insertedId,
          lastmessage : {}
        };
        db.collection("messageSession").insertOne(newSession,
          function(err,messageSession){
          if(err)
            cb(err)
          else{
            db.collection("users").updateMany({
              $or:[
                {_id:userid},
                {_id:targetid}
              ]
            },{$addToSet:{
              sessions: messageSession.insertedId
            }},function(err){
              if(err)
                cb(err)
              else{
                cb(null,newSession);
              }
            })
          }
        })
      }
    })
  }

  /**
   * Get the user ID from a token. Returns -1 (an invalid ID)
   * if it fails.
   */
   function getUserIdFromToken(authorizationLine) {
     try {
       // Cut off "Bearer " from the header value.
       var token = authorizationLine.slice(7);
       // Verify the token. Throws if the token is invalid or expired.
       var tokenObj = jwt.verify(token, secretKey);
       var id = tokenObj['id'];
       // Check that id is a string.
       if (typeof id === 'string') {
         return id;
       } else {
         // Not a string. Return "", an invalid ID.
         // This should technically be impossible unless
         // the server accidentally
         // generates a token with a number for an id!
         return "";
       }
     } catch (e) {
       // Return an invalid ID.
       return "";
     }
   }

  var ResetDatabase = require('./resetdatabase');
  // Reset database.
  app.post('/resetdb', function(req, res) {
      console.log("Resetting database...");
      ResetDatabase(db, function() {
          res.send();
      });
  });

  /**
   * Translate JSON Schema Validation failures into error 400s.
   */
  app.use(function(err, req, res, next) {
        if (err.name === 'JsonSchemaValidation') {
            // Set a bad request http response status
            res.status(400).end();
        } else {
            // It's some other sort of error; pass it to next error middleware handler
            next(err);
        }
    });

  /**
  * Translate JSON Schema Validation failures into error 400s.
  */
  app.use(function(err, req, res, next) {
    if (err.name === 'JsonSchemaValidation') {
      // Set a bad request http response status
      res.status(400).end();
    } else {
      // It's some other sort of error; pass it to next error middleware handler
      next(err);
    }
  });

  // get search result.
  app.get('/search/userid/:userid/querytext/:querytext',function(req,res){
    var fromUser = getUserIdFromToken(req.get('Authorization'));
    var querytext = req.params.querytext.toLowerCase();
    var userid = req.params.userid;
    var data={};
    if(userid === fromUser){
      db.collection('users').find({
        $or:
          [
            {fullname:{$regex:querytext,$options:'i'}}
          ]
      }).toArray(function(err, items) {
        if (err) {
          return sendDatabaseError(res, err);
        }
        data["users"]=items;

        db.collection('activityItems').find({
          description:{$regex:querytext,$options:'i'}
        }).toArray(function(err, activityitems) {
          if (err) {
            return sendDatabaseError(res, err);
          }
          data["activities"]=activityitems;

          db.collection('postFeedItems').find({
            ['contents.text']:{$regex:querytext,$options:'i'}
          }).toArray(function(err, postitems) {
            if (err) {
              return sendDatabaseError(res, err);
            }
            var postId=[];
            postitems.forEach((postitem)=>postId.push(postitem._id));
            var postfeeditems=[];
            postId.map((id)=>(getPostFeedItem(id,function(err,postfeeditem){(postfeeditems.push(postfeeditem))}

            )))

            data["posts"]=postfeeditems;

            var resolvedContents = [];

            function processNextFeedItem(i) {
              // Asynchronously resolve a feed item.
              getPostFeedItem(postId[i], function(err, feedItem) {
                if (err) {
                    sendDatabaseError(res, err);
                } else {
                  // Success!
                  resolvedContents.push(feedItem);
                  if (resolvedContents.length === postId.length) {
                    // I am the final feed item; all others are resolved.
                    // Pass the resolved feed document back to the callback.
                    data["posts"]=resolvedContents;
                    res.send(data);
                  } else {
                    // Process the next feed item.
                    processNextFeedItem(i + 1);
                  }
                }
              });
            }

            // Special case: Feed is empty.
            if (postId.length === 0) {
              res.send(data);
            } else {
              processNextFeedItem(0);
            }

          })

        })
      })
    }
    else{
      res.status(401).end();
    }
  });

  app.post('/signup',validate({body:userSchema}),function(req,res){
    var user = req.body;
    var password = user.password;
    user.email = user.email.trim().toLowerCase();

    bcrypt.hash(password,10,function(err,hash){
      if(err)
        sendDatabaseError(res,err);
      else{
        user.password = hash;
        user.nickname = "";
        user.avatar = "img/user.png";
        user.description = "";
        user.location = null;
        user.friends = [];
        user.sessions = [];
        user.birthday = 147812931;
        user.online = false;

        db.collection('users').insertOne(user,function(err,result){
          if(err)
            sendDatabaseError(res,err);
          else{
            var userId = result.insertedId;

            db.collection('postFeeds').insertOne({
              contents:[]
            },function(err,result){
              if(err)
                sendDatabaseError(res,err);
              else{
                var postId = result.insertedId;

                db.collection('notifications').insertOne({
                  contents:[]
                },function(err,result){
                  if(err)
                    sendDatabaseError(res,err);
                  else{
                    var notificationId = result.insertedId;

                    db.collection('activities').insertOne({
                      contents:[]
                    },function(err,result){
                      if(err)
                        sendDatabaseError(res,err);
                      else{
                        var activityId = result.insertedId;

                        db.collection('users').updateOne({_id:userId},{
                          $set: {
                            activity:activityId,
                            notification: notificationId,
                            post:postId
                          }
                        },function(err){
                          if(err)
                            sendDatabaseError(res,err);
                          else{
                            res.send();
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  app.post('/login',validate({body:loginSchema}),function(req,res){
    var body = req.body;
    var password = body.password;

    var email = body.email.trim().toLowerCase();

    db.collection('users').findOne({email:email},function(err,user){
        if(err)
          res.sendDatabaseError(res,err);
        else if(user===null){
          res.status(401).end();
        }
        else{
          bcrypt.compare(password,user.password,function(err,success){
            if(err){
              res.status(500).end();
            }
            else if(success){
              jwt.sign({
                id:user._id
              },secretKey,{expiresIn:'7 days'},function(token){
                delete user.password;
                res.send({
                  user:user,
                  token:token
                })
              });
            }
            else{
              res.status(401).end();
            }
          });
        }
    });

  });

  app.get('/activityNotification',function(req,res){
    db.collection('activityItems').count(function(err,count){
      res.send({result:count});
    });
  });

  app.get('/postNotification',function(req,res){
    db.collection('postFeedItems').count(function(err,count){
      res.send({result:count});
    });
  });

  app.post('/friendRequest/:sender/:target',function(req,res){
    var fromUser = getUserIdFromToken(req.get('Authorization'));
    var sender = req.params.sender;
    var target = req.params.target;
    if(fromUser === sender){
      db.collection('notificationItems').insertOne({
        sender: new ObjectID(sender),
        target: new ObjectID(target),
        type:"FR"
      },function(err,result){
        if(err)
          sendDatabaseError(res,err);
        else{
          getUserData(new ObjectID(target),function(err,userData){
            if(err)
              sendDatabaseError(res,err);
            else{
              db.collection('notifications').updateOne({_id:userData.notification},{
                $addToSet:{
                  contents: result.insertedId
                }
              },function(err){
                if(err)
                sendDatabaseError(res,err);
                else {
                  res.send();
                }
              });
            }
          });

        }
      });
    }
    else{
      res.status(401).end();
    }
  });

  var server = http.createServer(app);

  var io = require('socket.io')(server);
  io.on('connection', function(socket){

    socket.on('disconnect', function () {
      db.collection('userSocketIds').findOne({socketId:socket.id},function(err,socketData){
        if(socketData!==null){
          db.collection('users').updateOne({_id:socketData.userId},{
            $set:{
              online:false
            }
          });
          socket.broadcast.emit('online',socketData.userId);
        }
      });

      db.collection('userSocketIds').remove({socketId:socket.id});
    });

    socket.on('logout',function(user){
      db.collection('users').updateOne({_id:new ObjectID(user)},{
        $set:{
          online:false
        }
      });
      socket.broadcast.emit('online',user);
    });

    socket.on('user',function(user){

      db.collection('users').updateOne({_id:new ObjectID(user)},{
        $set:{
          online:true
        }
      });
      socket.broadcast.emit('online',user);
      db.collection('userSocketIds').updateOne({userId:new ObjectID(user)},{
        $set:{
          socketId:socket.id
        }
      },{upsert: true});


    });

    socket.on('chat',function(data){
      db.collection('userSocketIds').findOne({userId:new ObjectID(data.friend)},function(err,socketData){
        if(err)
          io.emit('chat',err);
        else if(socketData!==null && io.sockets.connected[socketData.socketId]!==undefined){
          io.sockets.connected[socketData.socketId].emit('chat');
        }
      });
    });

    socket.on('newPost',function(data){
      if(data.authorization!==undefined&&data.authorization!==null){
        var tokenObj = jwt.verify(data.authorization, secretKey);
        var id = tokenObj['id'];
        if(id===data.user){
          socket.broadcast.emit('newPost');
        }
      }
    });

    socket.on('newActivity',function(data){
      if(data.authorization!==undefined&&data.authorization!==null){
        var tokenObj = jwt.verify(data.authorization, secretKey);
        var id = tokenObj['id'];
        if(id===data.user){
          socket.broadcast.emit('newActivity');
        }
      }
    });

    socket.on('notification',function(data){
      if(data.authorization!==undefined&&data.authorization!==null){
        var tokenObj = jwt.verify(data.authorization, secretKey);
        var id = tokenObj['id'];
        if(id===data.sender){
          db.collection('userSocketIds').findOne({userId:new ObjectID(data.target)},function(err,socketData){
            if(err)
              io.emit('notification',err);
            else if(socketData!==null && io.sockets.connected[socketData.socketId]!==undefined){
              io.sockets.connected[socketData.socketId].emit('notification');
            }
          });
        }
      }
    });

  });

  server.listen(3000, function() {
      console.log('app listening on port 3000!');
  });
});
