const databaseName = "wemeet";
const ObjectID = require('mongodb').ObjectID;
const mongoClient = require('mongodb').MongoClient;
// const url = 'mongodb://localhost:27017/' + databaseName;

// Put the initial mock objects here.
var initialData = {
  "userSocketIds":{
    "1":{
      userId:new ObjectID("000000000000000000000001"),
      socketId:1
    },
    "2":{
      userId:new ObjectID("000000000000000000000002"),
      socketId:1
    },
    "3":{
      userId:new ObjectID("000000000000000000000003"),
      socketId:1
    }
  },
  //users
  "users":{
    "1":{
      "_id":new ObjectID("000000000000000000000001"),
      "fullname":"WeMeet",
      "nickname": "make your life better",
      "avatar": "img/logo/mipmap-xxhdpi/ic_launcher.png",
      "description": "Welcome to Wemeet! If there are any questions, ask me!",
      "friends":[new ObjectID("000000000000000000000002"),new ObjectID("000000000000000000000003")],
      "post":new ObjectID("000000000000000000000001"),
      "activity":new ObjectID("000000000000000000000001"),
      "notification":new ObjectID("000000000000000000000001"),
      "email": "upao@umass.edu",
      "birthday":1476057600000,
      "sessions":[new ObjectID("000000000000000000000001"),new ObjectID("000000000000000000000002")],
      "password":"$2a$10$1BmmDhIqBX7zdb/VlysJzeabojvhOc4yez/LCwwetMmTkzWlMGzMa",
      "online":false
    },
    "2": {
      "_id":new ObjectID("000000000000000000000002"),
      "fullname":"Test Account2",
      "nickname": "None",
      "avatar": "img/user.png",
      "description": "Hello everyone, I'm a test account",
      "friends":[new ObjectID("000000000000000000000001")],
      "post":new ObjectID("000000000000000000000002"),
      "activity":new ObjectID("000000000000000000000002"),
      "notification":new ObjectID("000000000000000000000002"),
      "email": "test@umass.edu",
      "birthday":1478129314000,
      "sessions":[new ObjectID("000000000000000000000001")],
      "password":"$2a$10$1BmmDhIqBX7zdb/VlysJzeabojvhOc4yez/LCwwetMmTkzWlMGzMa",
      "online":false
    },
    "3": {
      "_id":new ObjectID("000000000000000000000003"),
      "fullname":"Test Account3",
      "nickname": "None",
      "avatar": "img/user.png",
      "description": "Hello everyone, I'm a test account",
      "friends":[new ObjectID("000000000000000000000001")],
      "post":new ObjectID("000000000000000000000003"),
      "activity":new ObjectID("000000000000000000000003"),
      "notification":new ObjectID("000000000000000000000003"),
      "email": "test2@umass.edu",
      "birthday":1478129314000,
      "sessions":[new ObjectID("000000000000000000000002")],
      "password":"$2a$10$1BmmDhIqBX7zdb/VlysJzeabojvhOc4yez/LCwwetMmTkzWlMGzMa",
      "online":false
    }
  },
  //notification collections
  "notifications": {
      "1": {
        "_id":new ObjectID("000000000000000000000001"),
        "contents":[new ObjectID("000000000000000000000001"),new ObjectID("000000000000000000000002"),new ObjectID("000000000000000000000003")]
      },
      "2": {
        "_id":new ObjectID("000000000000000000000002"),
        "contents":[]
      },
      "3": {
        "_id":new ObjectID("000000000000000000000003"),
        "contents":[]
      }
  },
  "notificationItems": {
    "1": {
      "_id":new ObjectID("000000000000000000000001"),
      "target":new ObjectID("000000000000000000000001"),
      "sender":new ObjectID("000000000000000000000002"),
      "type": "FR"
    },
    "2": {
      "_id":new ObjectID("000000000000000000000002"),
      "target":new ObjectID("000000000000000000000001"),
      "sender":new ObjectID("000000000000000000000003"),
      "type": "AN",
      "RequestOrInvite": "request",
      "activityid":new ObjectID("000000000000000000000001")
    },
    "3": {
      "_id":new ObjectID("000000000000000000000003"),
      "target":new ObjectID("000000000000000000000001"),
      "sender":new ObjectID("000000000000000000000003"),
      "type": "AN",
      "RequestOrInvite": "invite",
      "activityid":new ObjectID("000000000000000000000003")
    }
  },
  //activity collection
  "activities": {
    "1": {
      "_id":new ObjectID("000000000000000000000001"),
      "contents": [new ObjectID("000000000000000000000001")]
    },
    "2": {
      "_id":new ObjectID("000000000000000000000002"),
      "contents": [new ObjectID("000000000000000000000002")]
    },
    "3": {
      "_id":new ObjectID("000000000000000000000003"),
      "contents":[new ObjectID("000000000000000000000003")]
    }
  },

  "activityItems":{
    "1": {
      "_id":new ObjectID("000000000000000000000001"),
      "type": "Event",
      "author":new ObjectID("000000000000000000000001"),
      "title": "Hack UMass",
      "postDate": 1478129314000,
      "img":"./img/HackUMass.jpg",
      "startTime": 1478129314000,
      "endTime": 1479940314000,
      "description": "Hack Umass",
      "location": "University of Massachusetts Amherst",
      "participants": [new ObjectID("000000000000000000000002")],
      "likeCounter": [new ObjectID("000000000000000000000001"),
      new ObjectID("000000000000000000000002"),new ObjectID("000000000000000000000003")],
      "contents": {
        "text": "Friday, October 7th\n6 PM - 9 PM: Check-in at Campus Center first floor, dinner at Blue Wall Cafe\n9 PM - 10 PM: Opening ceremony in Campus Center Auditorium\n 10 PM: Move to Integrative Learning Center (ILC) \n12 Midnight: Hacking begins in the ILC \n"
      },
      "commentsCount": 1
    },
    "2": {
      "_id":new ObjectID("000000000000000000000002"),
      "type": "Entertainment",
      "author":new ObjectID("000000000000000000000002"),
      "title": "birthday party",
      "img":"img/Birthday-Party.jpg",
      "startTime": 1478129314000,
      "postDate": 1478129313000,
      "endTime": 1479940314000,
      "description": "Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis.",
      "location": "University of Massachusetts Amherst",
      "participants": [],
      "likeCounter": [],
      "contents": {
        "text": "acticity detail of activity 2"
      },
      "commentsCount": 1
    },
    "3": {
      "_id":new ObjectID("000000000000000000000003"),
      "type": "Entertainment",
      "author":new ObjectID("000000000000000000000003"),
      "title": "dance party",
      "img":"img/parties.jpg",
      "startTime": 1478129314000,
      "postDate": 1478129312000,
      "endTime": 1479940314000,
      "description": "Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis.",
      "location": "University of Massachusetts Amherst",
      "participants": [new ObjectID("000000000000000000000002")],
      "likeCounter": [new ObjectID("000000000000000000000001"),new ObjectID("000000000000000000000002"),
      new ObjectID("000000000000000000000003")],
      "contents": {
        "text": "activity detail of activity 3"
      },
      "commentsCount": 1
    }
  },

  "activityItemComments": {
    "1": {
      "_id": new ObjectID("000000000000000000000001"),
      "comments":[
        {
          "author":new ObjectID("000000000000000000000001"),
          "postDate": 1478129314000,
          "text": "iufihishf"
        }
      ]
    },
    "2": {
      "_id": new ObjectID("000000000000000000000002"),
      "comments":[
        {
          "author":new ObjectID("000000000000000000000001"),
          "postDate": 1478129314000,
          "text": "iufihishf"
        }
      ]
    },
    "3": {
      "_id": new ObjectID("000000000000000000000003"),
      "comments":[
        {
          "author":new ObjectID("000000000000000000000001"),
          "postDate": 1478129314000,
          "text": "iufihishf"
        }
      ]
    }
  },

  activityItemChatMessages: {
    "1": {
      _id: new ObjectID("000000000000000000000001"),
      messages:[
        {
          "author": new ObjectID("000000000000000000000001"),
          "postDate": 1478129314000,
          "text": "hahaha"
        }
      ]
    },
    "2": {
      _id: new ObjectID("000000000000000000000002"),
      messages:[]
    },
    "3": {
      _id: new ObjectID("000000000000000000000003"),
      messages:[]
    }
  },

  // "feeds" collection. Feeds for each user.
  "postFeeds": {
    "3": {
      "_id":new ObjectID("000000000000000000000003"),
      "contents":[]
    },
    "2": {
      "_id":new ObjectID("000000000000000000000002"),
      "contents": []
    },
    "1": {
      "_id":new ObjectID("000000000000000000000001"),
      "contents": [new ObjectID("000000000000000000000001")]
    }
  },

  //post feed items
  "postFeedItems": {
    "1": {
      "_id":new ObjectID("000000000000000000000001"),
      "likeCounter":[],
      "type": "general",
      "contents": {
        "author":new ObjectID("000000000000000000000001"),
        //unix time
        "postDate": 1478129314000,
        "text": "What's up there",
        "img": ["img/tmp.jpg"]
      },
      "commentsCount": 2
    }
  },

  "postFeedComments": {
    "1": {
      "_id": new ObjectID("000000000000000000000001"),
      "comments": [
        {
          "author":new ObjectID("000000000000000000000002"),
          "text": "what's up",
          "postDate": 1478149440000
        },
        {
          "author":new ObjectID("000000000000000000000003"),
          "text": "Hello",
          "postDate": 1478149540000
        }
      ]
    }
  },

  // "messagesession" collection.
    "messageSession": {
      "1": {
        "_id":new ObjectID("000000000000000000000001"),
        "users": [new ObjectID("000000000000000000000001"),new ObjectID("000000000000000000000002")],
        "contents": new ObjectID("00000000000000000000000A"),
        "lastmessage":{
          "sender":new ObjectID("000000000000000000000001"),
          "target":new ObjectID("000000000000000000000002"),
          "date" : 1478149540000,
          "text": "cool",
          "isread":true
        }
      },
      "2": {
        "_id":new ObjectID("000000000000000000000002"),
        "users": [new ObjectID("000000000000000000000001"),new ObjectID("000000000000000000000003")],
        "contents": new ObjectID("00000000000000000000000B"),
        "lastmessage":{
          "sender":new ObjectID("000000000000000000000001"),
          "target":new ObjectID("000000000000000000000003"),
          "date" : 1478149540000,
          "text": "Good night!",
          "isread":true
        }
      }
    },
    //message table
    "message": {
      "1": {
        "_id":new ObjectID("00000000000000000000000A"),
        "messages": [
          {
            "sender":new ObjectID("000000000000000000000001"),
            "target":new ObjectID("000000000000000000000002"),
            "date" : 1478149540000,
            "text": "what's up",
            "imgs": ["img/chat/study.jpg"]
          },
          {
            "sender":new ObjectID("000000000000000000000002"),
            "target":new ObjectID("000000000000000000000001"),
            "date" : 1478149540000,
            "text": `
  Mr Trump tweeted that the process of selecting his new cabinet and other positions was "very organised".`,
            "imgs": []
            
          },
          {
            "sender":new ObjectID("000000000000000000000001"),
            "target":new ObjectID("000000000000000000000002"),
            "date" : 1478149540000,
            "text": "cool",
            "imgs": []
          }
        ]
      },
      "2": {
          "_id":new ObjectID("00000000000000000000000B"),
          "messages": [
            {
              "sender":new ObjectID("000000000000000000000001"),
              "target":new ObjectID("000000000000000000000003"),
              "date" : 1478149540000,
              "text": "yo",
              "imgs": []
            },
            {
              "sender":new ObjectID("000000000000000000000003"),
              "target":new ObjectID("000000000000000000000001"),
              "date" : 1478149540000,
              "text": `Good Night!.`,
              "imgs": []

            },
            {
              "sender":new ObjectID("000000000000000000000001"),
              "target":new ObjectID("000000000000000000000003"),
              "date" : 1478149540000,
              "text": "Good night!",
              "imgs": []
            }
          ]
        }

    }

  };
/**
 * Resets a collection.
 */
function resetCollection(db, name, cb) {
  // Drop / delete the entire object collection.
  db.collection(name).drop(function() {
    // Get all of the mock objects for this object collection.
    var collection = initialData[name];
    var objects = Object.keys(collection).map(function(key) {
      return collection[key];
    });
    // Insert objects into the object collection.
    db.collection(name).insertMany(objects, cb);
  });
}

/**
 * Adds any desired indexes to the database.
 */
function addIndexes(db, cb) {
  db.collection('users').createIndex({email:1},{unique:true},cb);
}

/**
 * Reset the MongoDB database.
 * @param db The database connection.
 */
function resetDatabase(db, cb) {
  // The code below is a bit complex, but it basically emulates a
  // "for" loop over asynchronous operations.
  var collections = Object.keys(initialData);
  var i = 0;

  // Processes the next collection in the collections array.
  // If we have finished processing all of the collections,
  // it triggers the callback.
  function processNextCollection() {
    if (i < collections.length) {
      var collection = collections[i];
      i++;
      // Use myself as a callback.
      resetCollection(db, collection, processNextCollection);
    } else {
      addIndexes(db, cb);
    }
  }

  // Start processing the first collection!
  processNextCollection();
}

function reset(cb){
  mongoClient.connect('mongodb://localhost:27017/wemeet, localhost:27018/wemeet2',{
    useNewUrlParser: true,
    replicaSet: 'rs0'
  }, function(err, database) {
    if (err) {
      throw new Error("Could not connect to database: " + err);
    } else {
      console.log("Resetting database...");
      var db = database.db(databaseName)
      resetDatabase(db, function() {
        console.log("Database reset!");
        // Close the database connection so NodeJS closes.
        database.close();
        cb();
      });
    }
  });
}

// Check if called directly via 'node', or required() as a module.
// http://stackoverflow.com/a/6398335
if(require.main === module) {
  // Called directly, via 'node src/resetdatabase.js'.
  // Connect to the database, and reset it!
  reset(()=>{
    console.log('reset!')
  });
} else {
  // require()'d.  Export the function.
  module.exports = reset;
}
