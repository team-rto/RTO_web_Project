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
var nodemailer = require('nodemailer');

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


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
         user: 'work.prakharvasistha@gmail.com',			//email ID
       pass: 'eiekorgsqjuxkhag'				//Password 
     }
 });
 function sendMail(email , otp){
   var details = {
     from: 'work.prakharvasistha@gmail.com', // sender address same as above
     to: email, 					// Receiver's email id
     subject: 'RTO App OTP ', // Subject of the mail.
     html: otp					// Sending OTP 
   };
 
 
   transporter.sendMail(details, function (error, data) {
     if(error)
       console.log(error)
     else
       console.log("OTP Sent!!!");
     });
   }
   
  //  var email = "vasistha.prakhar@gmail.com";
  //  var otp = "123456";
  //  sendMail(email,otp);			


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
var eotp;
app.post("/user/forgot/check", async (req, res) => {
 const email = req.body.email;
 const data = await Login.findOne({ where: { email: email } });
 if(data){
    let otp1 = Math.floor(100000 + Math.random() * 900000);
    let otp = otp1.toString();
    eotp = otp;
    sendMail(email,otp);
    res.redirect(`/user/forgot/${data.id}/otp`);
 } else {
  //alert("Email Not Found!!!!");
  res.redirect("/user/forgot");
}
})

app.get(`/user/forgot/:id/otp`, (req, res) => {
  const data = req.params;
  res.render("campgrounds/Login_Register/forgot/forgot1", { data });
});

app.post(`/user/forgot/:id/otp/check`, (req, res) => {
  let otp1 = req.body.otp;
  let otp = eotp;
  const data = req.params;
  // console.log(otp1);
  // console.log(eotp);
  if(otp == otp1){
    res.redirect(`/user/forgot/${ data.id }/reset`);
  }
  else{
    console.log("Wrong OTP!!!");
    res.redirect(`/user/forgot/${ data.id }/otp`);
  }

})

app.get(`/user/forgot/:id/reset`, (req, res) => {
  const data = req.params;
  res.render("campgrounds/Login_Register/reset/reset", { data });
});

app.put(`/user/forgot/:id/reset`, async (req, res) => {
  const {id} = req.params;
  const np = req.body.password;
  const nphash = await bcrypt.hash(np, 12);
  const l = await Login.update({ password: nphash }, {
    where: {
      id: id
    }
  });
  console.log("Password Updated Successfully!!!");
  res.redirect("/user/Login_Register/login");
})

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
    //alert('Wrong Credentials!!!!');
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
    //console.log(req.params.id);
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
app.post("/admin/logout", (req, res) => {
  //req.session.user_id = null;
  req.session.destroy();
  res.redirect("/");
});

app.get("/user/:id/dashboard", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/user/Login_Register/login");
  }
  const data = req.params;
  //console.log(data);
  res.render("main_page/services", { data });
});

app.get(`/user/:id/dashboard/dl`, async (req, res) => {
  const id = req.params.id;
  const data = await Login.findOne({ where: { id: id } });
  res.render("main_page/LicenseApplication", { data });
});
app.post(
  `/user/:id/dashboard/dl`,
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);
    const id = req.params.id;
    const dl = new Dl(req.body.dl);
    const dl1 = dl.dataValues;
    //console.log(id);
   dl1.c_id = id;
    const u1 = await Dl.create(dl1);
    res.redirect(`/user/${id}/dashboard/dl/display/${u1.id}`);
  })
);
app.get(`/user/:id/dashboard/dl/display/:dlid`, async (req, res) => {
  const id = req.params.id;
  const info = req.params;
  //console.log(info);
  const data1 = await Dl.findAll({ where: { c_id: id } });
 // console.log(data1);
  const data = data1[0].dataValues;
  res.render("dlcard", { data, info });
});
app.get(
  `/user/:id/dashboard/dl/show`,
  catchAsync(async (req, res) => {
   //const data = req.params;
   const info = req.params;
    const data1 = await Dl.findAll({ where: { c_id: req.params.id } });
    const data = data1[0].dataValues;
    //console.log(data);
  res.render("dlcard", { data, info });
  })
);
app.get(`/user/:id/dashboard/RC`, (req, res) => {
  const data = req.params;
  res.render("main_page/carRegistration", { data });
});
app.post(
  `/user/:id/dashboard/RC`,
  catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);
    const id = req.params.id;
    const rc = new Rc(req.body.rc);
    const rc1 = rc.dataValues;
    //console.log(rc1);
    rc1.c_id = id;
    const u1 = await Rc.create(rc1);
    //res.send("Successful Submission !!!");
    res.redirect(`/user/${id}/dashboard/rc/display/${u1.id}`);
  })
);
app.get(`/user/:id/dashboard/rc/display/:rcid`, async (req, res) => {
  const id = req.params.rcid;
  const info = req.params;
  // console.log(info);
  const data1 = await Rc.findAll({ where: { id: id } });
  const data = data1[0].dataValues;
  res.render("rccard", { data, info });
});
app.get(
  `/user/:id/dashboard/rc/show`,
  catchAsync(async (req, res) => {
   const data = req.params;
    const infos = await Rc.findAll({ where: { c_id: req.params.id } });
    res.render("campgrounds/index/index3", { data,infos });
  })
);

app.get(
  `/user/:id/dashboard/rc/:pid/edit`,
  catchAsync(async (req, res) => {
    const campground = await Rc.findAll({ where: { id: req.params.pid } });
      const data = campground[0].dataValues;
    res.render("campgrounds/edit/editrc", { data });
  })
);


app.put(
  `/user/:id/dashboard/rc/edit/:oid`,
  catchAsync(async (req, res) => {
    const user = new Rc(req.body.rc);
    const u = user.dataValues;
    u.id = req.params.oid;
    u.c_id = req.params.id;
    //console.log(user);
    const u1 = await Rc.update(
      u,
      {
        where: {
          id: req.params.oid,
        },
      }
    );
    res.redirect(`/user/${req.params.id}/dashboard/rc/display/${u.id}`);
  })
)

app.get(
  `/user/:id/dashboard/dl/edit`,
  catchAsync(async (req, res) => {
    const campground = await Dl.findAll({ where: { c_id: req.params.id } });

    const data = campground[0].dataValues;
    res.render("campgrounds/edit/editdl", { data });
  })
);

app.put(
  `/user/:id/dashboard/dl/edit/:oid`,
  catchAsync(async (req, res) => {
    const user = new Dl(req.body.dl);
    const u = user.dataValues;
    u.id = req.params.oid;
    u.c_id = req.params.id;
    //console.log(user);
    const u1 = await Dl.update(
      u,
      {
        where: {
          c_id: req.params.id,
        },
      }
    );
    res.redirect(`/user/${req.params.id}/dashboard/dl/display/${u.id}`);
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
       u,
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
