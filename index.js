const fs = require('fs');
const express = require ( "express" );
const { userInfo } = require('os');

// this is a canonical alias to make your life easier, like jQuery to $.
const app = express(); 

app.use(express.urlencoded({ extended: true})); 
app.use(express.json());
app.use(express.static("public"));


// a common localhost test port
const port = 3000; 

// Simple server operation
app.listen (port, () => {
    // template literal
    console.log (`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
    console.log("A user requested the root route");
});

app.get("/todo", (req, res) => {
    res.sendFile(__dirname + "/todo.html");
    console.log("A user accessed the todo page");
});


//Login Authentication
app.post("/login", (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    //Retrieve JSON list
    var user_data = fs.readFileSync("user-data.json");
    var user_JSON = JSON.parse(user_data);
    var valid = false;

    //If the login is valid, redirect user to todo page, otherwise, redirect user to the login page.
    if(email != "" && password != ""){
        for (var curr_user of user_JSON.users){
            if (email == curr_user.email && password == curr_user.password){
                valid = true;
                res.redirect("/todo");
            }  
        }
    } else {
        res.redirect("/");
    }
    if (!valid){res.redirect("/");}
});

//Signup Authentication
app.post("/signup", (req, res) => {

    var email = req.body.email;
    var password = req.body.password;
    var auth = req.body.auth;

    //Validate the user is creating a unique account, and inputted all 3 needed parameters for signup.
    if (!email.length || !password.length || !auth.length){
        res.redirect("/");
        } else {
            var user_data = fs.readFileSync("user-data.json");
            var user_JSON = JSON.parse(user_data);
            var unique_email = true;

            //Check if an account already exists with the provided email.
            for (var curr_user of user_JSON.users){
                if (email == curr_user.email){
                    res.redirect("/");
                    unique_email = false;
                }  
            }

            //If the user made a valid signup entry, add their credentials to the very secure user-data.json
            if (unique_email){
                user_JSON.users[user_JSON.users.length] = (req.body);
                data_str = JSON.stringify(user_JSON);
                fs.writeFile('user-data.json', data_str, function(err) {
                    if(err) console.log('error', err);
                });
                res.redirect("/todo");
            }
    }
});
