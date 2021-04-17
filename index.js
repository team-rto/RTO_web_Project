const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const { Sequelize } = require("sequelize");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const db = require("./models");

const { User } = require("./models");
const { Client } = require("./models");

// const db = mysql.createConnection({
//     user: "root",
//     host: "localhost",
//     password: "password",
//     database: "fake"
// });
app.get("/select", (req, res) => {
  User.findAll()
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get(
  "/home",
  catchAsync(async (req, res) => {
    const campgrounds = await User.findAll();
    res.render("campgrounds/index", { campgrounds });
  })
);

app.get("/policy", (req, res) => {
  res.render("campgrounds/privacypolicy");
});

app.get("/Terms", (req, res) => {
  res.render("campgrounds/Termsandconditions");
});

app.get("/home/Login_Register", (req, res) => {
  res.render("campgrounds/Login_Register/index");
});

app.get("/forgot", (req, res) => {
  res.render("campgrounds/Login_Register/forgot");
});

app.get("/register", (req, res) => {
  res.render("campgrounds/Login_Register/register");
});

app.get("/home/new", (req, res) => {
  res.render("campgrounds/new");
});
app.post(
  "/home",
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);

    const user = new User(req.body.User);
    const u = user.dataValues;
    const u1 = await User.create(u);
    res.redirect(`/home/${u1.dataValues.id}`);
  })
);
app.get(
  "/home/:id",
  catchAsync(async (req, res) => {
    console.log(req.params.id);
    const campground1 = await User.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/show", { campground });
  })
);

app.get(
  "/home/:id/edit",
  catchAsync(async (req, res) => {
    const campground1 = await User.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/edit", { campground });
  })
);

app.put(
  "/home/:id",
  catchAsync(async (req, res) => {
    const user = new User(req.body.campground);
    const u = user.dataValues;
    u.id = req.params.id;
    const u1 = await User.update(
      { ...req.body.campground },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    res.redirect(`/home/${req.params.id}`);
  })
);

app.delete(
  "/home/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    await User.destroy({
      where: {
        id: id,
      },
    });
    res.redirect("/home");
  })
);

db.sequelize.sync().then((req) => {
  app.listen(3001, () => {
    console.log("Server Running");
  });
});
