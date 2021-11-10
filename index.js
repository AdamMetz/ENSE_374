const fs = require('fs');
const express = require ( "express" );

// 1. Require dependencies /////////////////////////////////////////
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
require("dotenv").config();
////////////////////////////////////////////////////////////////////

// this is a canonical alias to make your life easier, like jQuery to $.
const app = express(); 

// 2. Create a session. The secret is used to sign the session ID.
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use (passport.initialize());
app.use (passport.session());
////////////////////////////////////////////////////////////////////

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true})); 
app.use(express.json());
app.use(express.static("public"));

const mongoose = require( "mongoose" );
const internal = require('stream');
// connect to mongoose on port 27017
mongoose.connect( "mongodb://localhost:27017/task_list_site", 
                { useNewUrlParser: true, 
                  useUnifiedTopology: true});


// 3. Create the userSchema /////////////////////////////////////////
// It is important not to change these names
// passport-local-mongoose expects these. Use `username` and `password`!
const userSchema = new mongoose.Schema ({
    username: String,
    password: String
})

// plugins extend Schema functionality
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
////////////////////////////////////////////////////////////////////

//Mongoose schema for a task
const taskSchema = new mongoose.Schema ({
    text: String,
    state: String,
    creator: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    isTaskClaimed: Boolean,
    claimingUser: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    isTaskDone: Boolean,
    isTaskCleared: Boolean
});

const Task = new mongoose.model ("Task", taskSchema);

class User_obj {
    constructor (username, password){
        this.username = username;
        this.password = password;
    }
}

class Task_obj {
    constructor (id, text, state, creator, isTaskClaimed, claimingUser, isTaskDone, isTaskCleared){
        this.id = id;
        this.text = text;
        this.state = state;
        this.creator = creator;
        this.isTaskClaimed = isTaskClaimed;
        this.claimingUser = claimingUser;
        this.isTaskDone = isTaskDone;
        this.isTaskCleared = isTaskCleared;
    }
}

// 4. Add our strategy for using Passport, using the local user from MongoDB
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
////////////////////////////////////////////////////////////////////

// a common localhost test port
const port = 3000; 

// Simple server operation
app.listen (port, () => {
    // template literal
    console.log (`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.render("index.ejs");
    console.log("A user requested the root route");
});

// 8. Logout ///////////////////////////////////////////////////////
app.get( "/logout", ( req, res ) => {
    console.log( "A user is logging out" );
    req.logout();
    res.redirect("/");
});
////////////////////////////////////////////////////////////////////

// 7. Register get routes for reviews and add-review ////////////////
app.get( "/todo", async( req, res ) => {
    console.log("A user is accessing the todo route using get, and...");
    if ( req.isAuthenticated() ){
        try {
            console.log( "was authorized and found:" );
            const tasks = await Task.find();
            res.render("todo.ejs", {username: req.user.username, uid: req.user.id, tasks: tasks});
            console.log("A user accessed the todo page");
        } catch ( error ) {
            console.log( error );
        }
    } else {
        console.log( "was not authorized." );
        res.redirect( "/" );
    }
});

// 6. Log in users on the login route ////////////////////////////////
app.post( "/login",  passport.authenticate( "local" , {successRedirect: "/todo", failureRedirect: "/"}));
////////////////////////////////////////////////////////////////////

// 5. Register a user with the following code, which needs to be in the appropriate route
// As in (3), be sure to use req.body.username and req.body.password, and ensure the 
// html forms match these values as well
app.post( "/register", (req, res) => {
    console.log( "User " + req.body.username + " is attempting to register" );
    console.log(req.body);
    if (req.body.auth === "todo2021"){
        User.register({ username : req.body.username }, 
            req.body.password, 
            ( err, user ) => {
        if ( err ) {
            console.log( err );
            res.redirect( "/" );
        } else {
            passport.authenticate( "local" )( req, res, () => {
                res.redirect( "/todo" );
            });
        }
        });
    } else{
        res.redirect( "/" );
    }
});
////////////////////////////////////////////////////////////////////

// 9. Submit a post to the database ////////////////////////////////
// Note that in the username, we are using the username from the
// session rather than the form
app.post( "/addtask", async( req, res ) => {
    console.log( "User " + req.user.username + " is adding a task" );
    //Check if the user entered anything for the task info.
    if (req.body.taskInfo.length){
        const task = new Task({
            text: req.body.taskInfo,
            state: "New Task",
            creator: req.user.id,
            isTaskClaimed: false,
            claimingUser: null,
            isTaskDone: false,
            isTaskCleared: false
        });
    
        task.save();
    }
    res.redirect( "/todo" );
});
////////////////////////////////////////////////////////////////////

//Claim a task
app.post("/claim", async(req, res) => {
    await Task.updateOne({_id: req.body.id}, {$set: {state: "Claimed", isTaskClaimed: true, claimingUser: req.user.id}});
    res.redirect("/todo");
});

//Abandon a task
app.post("/abandon", async(req, res) => {
    await Task.updateOne({_id: req.body.id}, {$set: {state: "New Task", isTaskClaimed: false, claimingUser: null}});
    res.redirect("/todo");
});

//Update task to complete
app.post("/complete", async(req, res) => {
    await Task.updateOne({_id: req.body.id}, {$set: {state: "Complete", isTaskDone: true}});
    res.redirect("/todo");
});

//Update task to uncomplete
app.post("/uncomplete", async(req, res) => {
    await Task.updateOne({_id: req.body.id}, {state: "Claimed", $set: {isTaskDone: false}});
    res.redirect("/todo");
});

//Remove all complete tasks
app.post("/purge", async(req, res) => {
    await Task.deleteMany({isTaskDone: true});
    res.redirect("/todo");
});



