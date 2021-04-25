/*
var ai = require("applicationinsights");
ai.setup(
  process.env.APPLICATIONINSIGHTSKEY || "your_instrumentation_key"
).start();
*/

const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const { Sequelize } = require("sequelize");
const https = require("https");
const fs = require("fs");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();

app.set("etag", false);

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
/* Don't comment below line, user login system will fail */
app.use(session({ secret: "hello", resave: false, saveUninitialized: true })); // heroku was showing error, but must for signing in

app.use(express.static("public"));
const db = require("./models");

const { User } = require("./models");
const { Rc } = require("./models");
const { Dl } = require("./models");
const { Login } = require("./models");
const config1 = require("./config1.js");
console.log(config1);

// const db = mysql.createConnection({
//     user: "root",
//     host: "localhost",
//     password: "password",
//     database: "fake"
// });
app.get(
  "/",
  catchAsync(async (req, res) => {
    res.render("main_page/front");
  })
);
app.get(
  "/admin",
  catchAsync(async (req, res) => {
    res.render("main_page/adminserv");
  })
);
app.get(
  "/admin/home",
  catchAsync(async (req, res) => {
    const campgrounds = await User.findAll();
    res.render("campgrounds/index/index", { campgrounds });
  })
);
app.get(
  "/admin/dl",
  catchAsync(async (req, res) => {
    const campgrounds = await Dl.findAll();
    res.render("campgrounds/index/index1", { campgrounds });
  })
);
app.get(
  "/admin/rc",
  catchAsync(async (req, res) => {
    const campgrounds = await Rc.findAll();
    res.render("campgrounds/index/index2", { campgrounds });
  })
);

app.get("/policy", (req, res) => {
  res.render("campgrounds/privacy/privacypolicy");
});

app.get("/Terms", (req, res) => {
  res.render("campgrounds/terms/terms");
});

app.get("/user/forgot", (req, res) => {
  res.render("campgrounds/Login_Register/forgot/forgot");
});

app.get("/user/forgot/reset", (req, res) => {
  res.render("campgrounds/Login_Register/reset/reset");
});

app.get("/user/register", (req, res) => {
  res.render("campgrounds/Login_Register/register/register");
});
app.post(
  "/user",
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);

    const login = new Login(req.body.Login);
    const l = login.dataValues;
    const password = l.password;
    const hash = await bcrypt.hash(password, 12);
    l.password = hash;
    const l1 = await Login.create(l);
    //console.log(l1.dataValues.id);
    req.session.user_id = l1.dataValues.id;
    res.redirect(`/user/${l1.dataValues.id}/dashboard`);
  })
);

app.get("/user/Login_Register/login", (req, res) => {
  res.render("campgrounds/Login_Register/login/index");
});
app.post("/user/login", async (req, res) => {
  const login = new Login(req.body.Login);
  const l = login.dataValues;
  const password = l.password;
  const email = l.email;
  const data = await Login.findOne({ where: { email: email } });
  const validPassword = await bcrypt.compare(password, data.password);
  //console.log(data.id);
  if (validPassword) {
    req.session.user_id = data.id;
    res.redirect(`/user/${data.id}/dashboard`);
  } else {
    res.redirect("/user/Login_Register/login");
  }
});

app.get("/admin/home/new", (req, res) => {
  res.render("campgrounds/new/new");
});
app.post(
  "/admin/home",
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);

    const user = new User(req.body.User);
    const u = user.dataValues;
    const u1 = await User.create(u);
    res.redirect(`/admin/home/${u1.dataValues.id}`);
  })
);
app.get(
  "/admin/home/:id",
  catchAsync(async (req, res) => {
    console.log(req.params.id);
    const campground1 = await User.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/show/show", { campground });
  })
);
app.get(
  "/admin/dl/:id",
  catchAsync(async (req, res) => {
    console.log(req.params.id);
    const campground1 = await Dl.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/show/show1", { campground });
  })
);
app.get(
  "/admin/rc/:id",
  catchAsync(async (req, res) => {
    console.log(req.params.id);
    const campground1 = await Rc.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/show/show2", { campground });
  })
);

app.post("/user/logout", (req, res) => {
  //req.session.user_id = null;
  req.session.destroy();
  res.redirect("/user/Login_Register/login");
});

app.get("/user/:id/dashboard", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/user/Login_Register/login");
  }
  const data = req.params;
  //console.log(data);
  res.render("main_page/services", { data });
});

app.get(`/user/:id/dashboard/dl`, async(req, res) => {
  const id = req.params.id;
  const data = await Login.findOne({ where: { id: id } });
  res.render("main_page/LicenseApplication", { data });

});
app.post(
  `/user/:id/dashboard/dl`,
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);

    const dl = new Dl(req.body.dl);
    const dl1 = dl.dataValues;
    //console.log(dl1);
    const u1 = await Dl.create(dl1);
    res.send("Successful Submission !!!");
  })
);

app.get(`/user/:id/dashboard/RC`, (req, res) => {
  const data = req.params;
  res.render("main_page/carRegistration",{ data });
});
app.post(
  `/user/:id/dashboard/RC`,
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);

    const rc = new Rc(req.body.rc);
    const rc1 = rc.dataValues;
    //console.log(rc1);
    const u1 = await Rc.create(rc1);
    res.send("Successful Submission !!!");
  })
);

app.get(
  "/admin/home/:id/edit",
  catchAsync(async (req, res) => {
    const campground1 = await User.findAll({ where: { id: req.params.id } });
    const campground = campground1[0].dataValues;
    res.render("campgrounds/edit/edit", { campground });
  })
);

app.put(
  "/admin/home/:id",
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
    res.redirect(`/admin/home/${req.params.id}`);
  })
);

app.delete(
  "/admin/home/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    await User.destroy({
      where: {
        id: id,
      },
    });
    res.redirect("/admin/home");
  })
);
app.delete(
  "/admin/dl/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    await Dl.destroy({
      where: {
        id: id,
      },
    });
    res.redirect("/admin/dl");
  })
);
app.delete(
  "/admin/rc/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    await Rc.destroy({
      where: {
        id: id,
      },
    });
    res.redirect("/admin/rc");
  })
);

db.sequelize.sync().then((req) => {
  app.listen(3000, () => {
    console.log("Server Running");
  });
  /*
const server = app.listen(config1.server.port, () => {
  console.log(`Sticker server running on port ${server.address().port}`);
});
*/
});
