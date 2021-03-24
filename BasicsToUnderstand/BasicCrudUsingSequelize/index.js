const express = require("express");
const path = require('path');
const ejsMate =  require('ejs-mate');
const { Sequelize } = require('sequelize');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true}));
app.use(methodOverride('_method'));


const db = require("./models");

const { User } = require('./models')


// const db = mysql.createConnection({
//     user: "root",
//     host: "localhost",
//     password: "password",
//     database: "fake"
// });
app.get('/select', (req, res) => {
    User.findAll().then((user) => {
        res.send(user);
    })
    .catch((err) => {
        console.log(err);
    });
});
app.get('/home', catchAsync(async (req, res) => {
    const campgrounds = await User.findAll();
    res.render('campgrounds/index', { campgrounds })
}))

app.get('/home/new', (req, res) => {
    res.render('campgrounds/new');
})
app.post('/new', catchAsync(async (req, res, next) => {
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data!!', 400);
   
    const user = new User(req.body.User);
    const u = user.dataValues;
    const u1 = await User.create(u);
    res.redirect(`/home/${u1.dataValues.id}`)
}))
app.get('/home/:id', catchAsync(async (req, res) => {
    console.log(req.params.id);
    const campground1 = await User.findAll({ where: {id: req.params.id}});
    const campground = campground1[0].dataValues;
    res.render('campgrounds/show', {campground});
}))


app.get('/insert', (req, res) => {
    User.create({
        firstName: "pedro",
        age: 19
    }).catch((err) => {
        console.log(err);
    });
    res.send("Inserted");
});

app.get('/delete', (req, res) => {
    User.destroy({ where: { id: 4 }});
    res.send('Deleted');
});



db.sequelize.sync().then((req) => {
    app.listen(3001, () => {
        console.log("Server Running");
    });
});
