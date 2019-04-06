var express = require("express");
var path = require("path");
const ejs = require("ejs");
var bodyParser = require("body-parser");
var mysql = require("mysql");
var multer = require("multer");
var app = express();
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(
  require("express-session")({
    secret: "I'm Nithin",
    resave: false,
    saveUninitialized: false
  })
);
var User = require("./models/user");
// EJS
app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost/w");
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Public Folder
app.use(express.static("./public"));
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "nithin#144026",
  database: "dbms_project"
});
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected");
});

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single("myImage");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Public Folder
app.use(express.static("./public"));

app.post("/upload", (req, res) => {
  console.log(req.file);
  upload(req, res, err => {
    if (err) {
      res.render("index", {
        msg: err
      });
    } else {
      if (req.file == undefined) {
        res.render("index", {
          msg: "Error: No File Selected!"
        });
      } else {
        console.log(req.file.filename);
        var person = {
          email: req.user.username,
          fname: req.body.fname,
          lname: req.body.lname,
          dob: req.body.dob,
          phone: req.body.phone,
          gender: req.body.gender,
          bio: req.body.bio,
          url: `../public/uploads/${req.file.filename}`
        };
        var q = "insert into user set ?";
        connection.query(q, person, function(err, results, fields) {
          if (err) throw err;
          else {
            console.log(results);
            res.redirect("/profile");
          }
        });
      }
    }
  });
});
app.get("/qwerty", function(req, res) {
  res.render("qwerty", { currentUser: req.user });
});
app.get("/updates", function(req, res) {
  var q =
    "select u.fname,u.lname,n.update_info,n.update_id,n.total_likes from user u,updates n where u.user_id=n.user_id order by n.created_at desc";
  connection.query(q, function(err, results) {
    if (err) throw err;
    else {
      var q1 =
        "select update_id,count(*) as count from likes group by update_id order by update_id desc";
      connection.query(q1, function(err, result) {
        if (err) throw err;
        else {
          console.log(result);
          res.render("updates", { a: results, currentUser: req.user });
        }
      });
    }
  });
});
// app.get("/updates1", function(req, res) {
//   var q =
//     "select u.fname,n.update_info,n.update_id,count(*) as count ,n.created_at from user u,newupdate n,likes l where u.user_id=n.user_id and u.user_id=l.user_id group by update_id order by n.created_at desc";
//   connection.query(q, function(err, results) {
//     if (err) throw err;
//     else {
//       console.log(results);
//     }
//   });
// });
app.get("/likes/:lid", isLoggedIn, function(req, res) {
  var q = "select user_id from user where email=?";
  connection.query(q, [req.user.username], function(err, results) {
    if (err) {
      throw err;
    } else {
      console.log(results[0]);
      var likes = {
        user_id: results[0].user_id,
        update_id: req.params.lid
      };
      var q1 = "insert into likes set ?";
      connection.query(q1, likes, function(err, results, fields) {
        if (err) throw err;
        else {
          console.log(results);
          res.redirect("/updates");
        }
      });
    }
  });
});
app.get("/", function(req, res) {
  res.render("index", { currentUser: req.user });
});

/*app.get("/events/:e_id", function(req, res) {
  var q = "select * from sponsored_by where event_id=?";
  connection.query(q, [req.params.e_id], function(err, results) {
    if (err) throw err;
    else {
      
      console.log(results[0]);
      res.render("Hey");
    }
  });
});*/
app.get("/events/:e_id", function(req, res) {
  var q = "select * from organized_by where event_id=?";
  connection.query(q, [req.params.e_id], function(err, results) {
    if (err) throw err;
    else {
      var q1 =
        "select * from eventheads eh,organized_by o where eh.eventhead_id=o.eventhead_id and o.event_id=?";
      connection.query(q1, [results[0].event_id], function(err, result) {
        if (err) throw err;
        else {
          var q2 = "select * from eventstable where event_id=?";
          connection.query(q2, [results[0].event_id], function(err, resul) {
            if (err) throw err;
            else {
              var q3 =
                "select * from sponsors eh,sponsored_by o where eh.sponsor_id=o.sponsor_id and o.event_id=?";
              connection.query(q3, [results[0].event_id], function(err, resu) {
                if (err) throw err;
                else {
                  var q4 = "select * from event_gallery where event_id=?";
                  connection.query(q4, [results[0].event_id], function(
                    err,
                    re
                  ) {
                    if (err) throw err;
                    else {
                      console.log(results);
                      console.log(result);
                      console.log(resul);
                      console.log(resu);
                      console.log(re);
                      var a = result;
                      var b = resul[0];
                      var c = resu;
                      var d = re;

                      res.render("event", {
                        head: a,
                        detail: b,
                        sponsor: c,
                        gallery: d
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
app.post("/info", function(req, res) {
  var person = {
    email: req.user.username,
    fname: req.body.fname,
    lname: req.body.lname,
    dob: req.body.dob,
    phone: req.body.phone,
    gender: req.body.gender,
    bio: req.body.bio
  };
  var q = "insert into user set ?";
  connection.query(q, person, function(err, results, fields) {
    if (err) throw err;
    else {
      // console.log(results);
      res.redirect("/profile");
    }
  });
});
app.get("/profile", function(req, res) {
  res.render("profile", { currentUser: req.user });
});
app.get("/profile/:pid", function(req, res) {
  var q = "select * from user where  email=?";
  connection.query(q, [req.params.pid], function(err, results) {
    if (err) throw err;
    else {
      console.log(results);
      res.render("profileyou", { a: results[0], currentUser: req.user });
    }
  });
});
app.get("/addskill", function(req, res) {
  res.render("addskill", { currentUser: req.user });
});
app.get("/addupdate", function(req, res) {
  res.render("addupdate", { currentUser: req.user });
});
app.get("/updatebio", function(req, res) {
  res.render("updatebio", { currentUser: req.user });
});
app.get("/deleteaccount", function(req, res) {
  var q = "delete from user  where email=? ";
  connection.query(q, [req.user.username], function(err, results) {
    if (err) throw err;
    else {
      User.findOne({ username: { $in: [req.user.username] } }).remove(function(
        er,
        a
      ) {
        if (er) throw er;
        else {
          res.redirect("/logout");
        }
      });
    }
  });
});
app.post("/updatebio", function(req, res) {
  var q = "select user_id from user where email=?";
  connection.query(q, [req.user.username], function(err, results) {
    if (err) throw err;
    else {
      var q = "update user set bio = ? where email = ?";
      connection.query(q, [req.body.bio, req.user.username], function(
        err,
        results,
        fields
      ) {
        if (err) throw err;
        else {
          // console.log(results);
          res.redirect("/profile/" + req.user.username);
        }
      });
    }
  });
});
app.post("/addskill", function(req, res) {
  var q = "select user_id from user where email=?";
  connection.query(q, [req.user.username], function(err, results) {
    if (err) throw err;
    else {
      console.log(results[0]);
      var skills = {
        user_id: results[0].user_id,
        skill: req.body.skill
      };
      var q = "insert into skills set ?";
      connection.query(q, skills, function(err, results, fields) {
        if (err) throw err;
        else {
          // console.log(results);
          res.redirect("/addskill");
        }
      });
    }
  });
});
app.post("/addupdate", function(req, res) {
  var q = "select user_id from user where email=?";
  connection.query(q, [req.user.username], function(err, results) {
    if (err) throw err;
    else {
      console.log(results[0]);
      var updates = {
        user_id: results[0].user_id,
        update_info: req.body.update,
        total_likes: 0
      };
      var q = "insert into updates set ?";
      connection.query(q, updates, function(err, results, fields) {
        if (err) throw err;
        else {
          // console.log(results);
          res.redirect("/addupdate");
        }
      });
    }
  });
});
app.get("/info", function(req, res) {
  res.render("info");
});

app.get("/sign-up", function(req, res) {
  res.render("signup");
});
app.post("/signup", function(req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function(er, user) {
    if (er) {
      console.log(er);
      return res.render("signup");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/info");
    });
  });
});

// app.post("/findfriendskill", function(req, res) {
//   console.log(req.body.skill);
//   var q =
//     "call proc('=?')";
//   connection.query(q, [req.body.skill], function(err, results) {
//     if (err) throw err;
//     else {
//       console.log(results);
//       res.render("findfriendskill", { a: results, currentUser: req.user });
//     }
//   });
// });

app.post("/findfriendskill", function(req, res) {
  console.log(req.body.skill);
  var q =
    "select u.email,u.fname,u.lname,u.phone,u.url,u.bio,s.skill from user u,skills s  where u.user_id=s.user_id and skill=?";
  connection.query(q, [req.body.skill], function(err, results) {
    if (err) throw err;
    else {
      console.log(results);
      res.render("findfriendskill", { a: results, currentUser: req.user });
    }
  });
});
app.post("/findfriend", function(req, res) {
  var q =
    "select email,fname,lname,phone,url,bio from user where fname=? or lname=? or email = ? or phone=? ";
  connection.query(
    q,
    [req.body.fname, req.body.lname, req.body.email, req.body.phone],
    function(err, results) {
      if (err) throw err;
      else {
        console.log(results);
        res.render("findfriend", { a: results, currentUser: req.user });
      }
    }
  );
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/"
  }),
  function(req, res) {}
);
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("notlogged");
}

app.listen(3000, function() {
  console.log("server is listening");
});
