module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        Name:{
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        age:{
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        Dob:{
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        father:{
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        Category:{
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        Address:{
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

    });
    return User;
};