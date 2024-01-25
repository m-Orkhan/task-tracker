var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = 
        require("passport-local-mongoose")
const User = require("./model/User");
var app = express();

  
mongoose.connect('mongodb://127.0.0.1:27017/test');
  
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));
  
app.use(passport.initialize());
app.use(passport.session());
  
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
  

app.get("/", function (req, res) {
    res.render("home");
});

  

app.get("/register", function (req, res) {
    res.render("register");
});
  

app.post("/register", async (req, res) => {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password
    });
    
    res.redirect("/login");
  });


  

app.get("/login", function (req, res) {
    res.render("login");
});
  

app.post("/login", async function(req, res){
    try {
        
        const user = await User.findOne({ username: req.body.username });
        if (user) {
        
          const result = req.body.password === user.password;
          if (result) {
            req.session.userId = user._id;
            res.redirect("/save_task");
          } else {
            res.status(400).json({ error: "password doesn't match" });
          }
        } else {
          res.status(400).json({ error: "User doesn't exist" });
        }
      } catch (error) {
        res.status(400).json({ error });
      }
});
  

app.post("/store", async (req, res) => {
  try {
    const data = req.body.data;
    const userId = req.session.userId; 

    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { tasks: data } },
      { new: true }
    );

  
    res.redirect("/save_task");
  } catch (error) {
    res.status(400).json({ error });
  }
});

app.post("/delete", async (req, res) => {
  try {
    const userId = req.session.userId;
    const taskId = req.body.taskId;

  
    const user = await User.findById(userId);
    if (!user) {
     
      res.redirect("/login");
      return;
    }
    
    user.tasks.splice(taskId, 1);
    await user.save();

    
    res.redirect("/save_task");
  } catch (error) {
    res.status(400).json({ error });
  }
});

app.get("/save_task", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.redirect("/login");
      return;
    }

    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.redirect("/login");
      return;
    }


    res.render("save_task", { user: user });
  } catch (error) {
    res.status(400).json({ error });
  }
});


  

app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});
  
  
  
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}
  
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});