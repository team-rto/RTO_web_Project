const express = require("express");
const app = express();

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
