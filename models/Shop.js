const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name:String,
    village:String,
    stock:{
        Rice:Number,
        Wheat:Number,
        Sugar:Number,
        Kerosene:Number
    }
});

module.exports = mongoose.model("Shop", schema);