// init project
const express = require('express'); // the library we will use to handle requests. import it here
const app = express(); // instantiate express
app.use(require("cors")()) // allow Cross-domain requests 
app.use(require('body-parser').json()) // When someone sends something to the server, we can recieve it in JSON format
var bcrypt = require('bcrypt');
console.log("here");


//////////////////////////////////////////////////
//Mongo below
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
//Mongo above 
//////////////////////////////////////////////////

//////////////////////////////////////////////////
//Mysql below
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password480',
  database: '2017_mysqldata'     //added for top2017 database
});
connection.connect(function (err) {
  if (err) {
    throw err;
  } else {
    console.log("connected");
  }
});
//Mysql above
//////////////////////////////////////////////////

////////////////////////////////////
//postgres below 
const Pool  = require('pg').Pool;
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'password',
  database: 'spotifyProject',
  port:5432
});
//postgres up
////////////////////////////////////



app.post("/loginMySql", (req, res) => {
  // search the database (collection) for all users with the `user` field being the `user` route paramter
  console.log("logging in ");
  var password = req.body.password;
  var username = req.body.username;
  console.log(username + " " + password);
  connection.query('SELECT * FROM userdata.users WHERE userdata.users.userName = ?', [username], async function (error, results, fields) {
    if (error) {
      res.send({
        "code": 400,
        "failed": "error ocurred"
      })
    } 
    else {
      if (results.length == 1) {
        console.log(results[0].password);
        console.log(password.localeCompare(results[0].password) + results[0] + results[1]);
        const comparision = password.localeCompare(results[0].password);
        if (comparision == 0) {
          res.send({
            "code": 200,
            "success": "login sucessfull",
            "userid": results[0].userID,
            "username": results[0].userName
          })
        }
        else {
          res.send({
            "code": 204,
            "success": "Email and password does not match"
          })
        }
      }
      else {
        res.send({
          "code": 206,
          "success": "Username does not exist"
        });
      }
    }
  });
});

app.post("/registerNewMySql", (req, res) => {
  // search the database (collection) for all users with the `user` field being the `user` route paramter
  console.log("registering");
  const password = req.body.password
  var username = req.body.username;
  console.log("password is " + password);
  console.log("username is " + username);
  var user = {
    "userName": username,
    "password": password
  }
  connection.query('INSERT INTO userdata.users SET ?', user, function (error, results, fields) {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("errored dup!" + error)
        res.send({
          "code": 400,
          "failed": "Duplicate entry!"
        })
      }
      else {
        console.log("errored!" + error)
        res.send({
          "code": 400,
          "failed": "error ocurred"
        })
      }
    } 
    else {
      console.log(results.insertId);
      res.send({
        "code": 200,
        "success": "user registered sucessfully",
        "userid": results.insertId
      });
    }
  });
});

app.post("/getPlayTable", (req, res) => {
  var userid = req.body.userId;
  var sortBy = req.body.sortBy;
  if (sortBy == "") {
    connection.query("SELECT * FROM userdata.usermusic WHERE userdata.usermusic.userID = " + userid, function (error, results, fields) {
      if (error) {
        console.log("errored!" + error)
        res.send({
          "code": 400,
          "failed": "error ocurred"

        });
      }
      else {
        res.send({
          "code": 200,
          "success": "Got songs!",
          "result": results
        });
      }
    });
  }
  else {
    connection.query("SELECT * FROM userdata.usermusic WHERE userdata.usermusic.userID = " + userid + " order by " + sortBy, function (error, results, fields) {
      if (error) {
        console.log("errored!" + error)
        res.send({
          "code": 400,
          "failed": "error ocurred"

        });
      }
      else {
        res.send({
          "code": 200,
          "success": "Got songs!",
          "result": results
        });
      }
    });
  }
});

app.post("/addToPlaylist", (req, res) => {
  var userid = req.body.userId;
  var title = req.body.title;
  var artist = req.body.artist;
  var genre = req.body.genre;
  console.log("trying to add to " + userid);
  var song = {
    "userId": userid,
    "title": title,
    "artist": artist,
    "genre": genre,
  }
  connection.query('INSERT INTO userdata.usermusic SET ?', song, function (error, results, fields) {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("errored dup!" + error)
        res.send({
          "code": 400,
          "failed": "Duplicate Song Title!"
        })
      }
      else {
        console.log("errored!" + error)
        res.send({
          "code": 400,
          "failed": "error ocurred"
        })
      }
    } else {
      res.send({
        "code": 200,
        "success": "Song added Successfully!",

      });
    }
  });
});

app.post("/searchMongo", (req, res) => {
  // inserts a new document in the database (collection)
  console.log("searching");
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("480DataBase");
    console.log("success");
    console.log("body" + req.body.title);

    var titleToFind = req.body.title;
    var artistToFind = req.body.artist;
    console.log("Title" + titleToFind);
    console.log("Artist" + artistToFind);
    if (artistToFind == '') {
      console.log("checking title");
      var query = { title: { $regex: ".*" + titleToFind + ".*" } };
    }
    else if (titleToFind == '') {
      console.log("checking artist");
      var query = { artist: { $regex: ".*" + artistToFind + ".*" } };
    }
    var sortedReq;
    if (req.body.sortBy == 'title:1') {
      sortedReq = { title: 1 };
      console.log("sort t as");
    }
    else if (req.body.sortBy == 'title:-1') {
      sortedReq = { title: -1 };
      console.log("sort t ds");
    }
    else if (req.body.sortBy == 'artist:1') {
      sortedReq = { artist: 1 };
      console.log("sort a as");
    }
    else if (req.body.sortBy == 'artist:-1') {
      sortedReq = { artist: -1 };
      console.log("sort a ds");
    }
    else if (req.body.sortBy == 'pop:1') {
      sortedReq = { pop: 1 };
      console.log("sort p as");
    }
    else if (req.body.sortBy == 'pop:-1') {
      sortedReq = { pop: -1 };
      console.log("sort p ds");
    }
    //console.log(sort);
    dbo.collection("Top2010-19").find(query).sort(sortedReq).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      //res.json(result);
      res.send(result)
      db.close();
    });
  });
});

app.post("/searchMysql", (req, res) => {
  console.log("searching");
  var titleToFind2 = req.body.title;
  var artistToFind2 = req.body.artist;
  var sortBy = req.body.sortBy;
  console.log("Title2 " + titleToFind2);
  console.log("Artist2 " + artistToFind2);
  console.log("sortBy " + sortBy);

  if (artistToFind2 != "" && sortBy != "") {
    console.log("checking artist2");
    var sql = "SELECT * FROM top2017 WHERE artists LIKE '%" + [artistToFind2] + "%' " ;
    connection.query(sql + "ORDER BY " + sortBy, 
      function (error, results) {
        if (error) {
          console.log(error);
          console.log("HERE in 1");
        }
        console.log("returned stuff: ", results);
        
        return res.send({
          "code": 200,
          "results": results
        });
      }
    );
  }

  else if (titleToFind2 != "" && sortBy != "") {
    console.log("checking title2");
    var sql = "SELECT * FROM top2017 WHERE title LIKE '%" + [titleToFind2] + "%' ";
    connection.query(sql + "ORDER BY " + sortBy,
      function (error, results) {
        if (error) {
          console.log(error);
          console.log("HERE in 2");
        }
        console.log("returned stuff: ", results);

        return res.send({
          "code": 200,
          "results": results
        });
      }
    );
  }

  else if (artistToFind2 != '') {
    console.log("checking artists2");
    connection.query('SELECT * FROM top2017 WHERE artists LIKE ?', '%' + artistToFind2 + '%',
      function (error, results) {
        if (error) {
          console.log(error);
        }
        console.log("returned stuff: ", results);
        return res.send({
          "code": 200,
          "results": results
        });
      }
    );
  }
  
  else if (titleToFind2 != '') {
    console.log("checking title2");
    connection.query('SELECT * FROM top2017 WHERE title LIKE ?', '%' + titleToFind2 + '%',
      function (error, results) {
        if (error) {
          console.log(error);
        }
        console.log("returned stuff: ", results);
        return res.send({
          "code": 200,
          "results": results
        });
      }
    );
  }

 console.log('WE MADE IT TO THE END');
});

app.post("/searchPostgres", (req, res) => {
  // inserts a new document in the database (collection)
  console.log("searching");
  var titleToFind3 = req.body.title;
  var artistToFind3 = req.body.artist;
  var sortBy = req.body.sortBy;
  console.log("Title3 " + titleToFind3);
  console.log("Artist3 " + artistToFind3);
  console.log("sortBy " + sortBy);

  if (artistToFind3 != "" && sortBy != "") {
    console.log("checking artist3");
    var sql = "SELECT * FROM top2018 WHERE artists LIKE '%" + [artistToFind3] + "%' ";
    pool.query(sql + "ORDER BY " + sortBy,
      (error, results) => {
        if (error) {
          console.log(error);
          console.log("HERE in 1");
        }
        console.log("returned stuff: ", results.rows);
        res.send({     
          "code": 200,
          "results": results.rows
        });
      }
    );
  }

  else if (titleToFind3 != "" && sortBy != "") {
    console.log("checking title3");
    var sql = "SELECT * FROM top2018 WHERE title LIKE '%" + [titleToFind3] + "%' ";
    var depressed = pool.query(sql + "ORDER BY " + sortBy,
      (error, results) => {
        if (error) {
          console.log(error);
          console.log("HERE in 2");
        }
        console.log("returned stuff: ", results);
        res.send({
          "code": 200,
          "results": results.rows
        });
      }
    );
  }

  else if (artistToFind3 != '') {
    console.log("checking artists3");
    pool.query("SELECT * FROM top2018 WHERE artists LIKE '%" + [artistToFind3] + "%'",
      (error, results) => {
        if (error) {
          console.log(error);
        }
        console.log("returned stuff: ", results.rows);
        res.send({
          "code": 200,
          "results": results.rows
        });
      }
    );
  }

  else if (titleToFind3 != '') {
    console.log("checking title3");
    pool.query("SELECT * FROM top2018 WHERE title LIKE '%" + [titleToFind3] + "%'",
      (error, results) => {
        if (error) {
          console.log(error);
        }
        console.log("returned stuff: ", results);
        res.send({
          "code": 200,
          "results": results.rows
        });
      }
    );
  }

  console.log('WE MADE IT TO THE END Postgress');
});

// listen for requests on port 4567
const port = 4567;
var listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
/*
const net = require('net');
// A use-once date server. Clients get the date on connection and that's it!
const server = net.createServer((socket) => {
  socket.end(`${new Date()}\n`);
});

server.listen(4567);
*/