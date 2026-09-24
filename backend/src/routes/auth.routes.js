const express = require("express");

const {registerUser, loginUser, userDetails, logoutUser} = require("../controllers/auth.controller");
const {authenticateToken} = require("../middleware/auth.middleware");   

const route = express.Router(); 

route.post("/register", registerUser);
route.post("/login", loginUser);
route.get("/user", authenticateToken, userDetails);
route.post("/logout", logoutUser)

module.exports = route;