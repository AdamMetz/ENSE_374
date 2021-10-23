const fs = require('fs');
const express = require ( "express" );
const { userInfo } = require('os');

// this is a canonical alias to make your life easier, like jQuery to $.
const app = express(); 

app.set("view engine", "ejs");
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
    res.render("index.ejs");
    console.log("A user requested the root route");
});

app.get("/todo", (req, res) => {
    res.redirect("/");
});

app.get("/logout", (req, res) => {
    res.redirect("/");
});

app.post("/todo", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_list = JSON.parse(task_data).Tasks;
    res.render("todo.ejs", {user_obj: req.body, tasks: task_list});
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
        for (var curr_user of user_JSON.Users){
            if (email === curr_user.email && password === curr_user.password){
                valid = true;
                res.redirect(307, "/todo");
            }  
        }
    }
    if (!valid){res.redirect("/")};
});

//Signup Authentication
app.post("/register", (req, res) => {

    var email = req.body.email;
    var password = req.body.password;
    var auth = req.body.auth;

    //Validate the user is creating a unique account, and inputted all 3 needed parameters for signup.
    if (!email.length || !password.length || !auth.length || auth != "todo2021"){
        res.redirect("/");
        } else {
            var user_data = fs.readFileSync("user-data.json");
            var user_JSON = JSON.parse(user_data);
            var unique_email = true;

            //Check if an account already exists with the provided email.
            for (var curr_user of user_JSON.Users){
                if (email == curr_user.email){
                    res.redirect("/");
                    unique_email = false;
                }  
            }

            //If the user made a valid signup entry, add their credentials to the very secure user-data.json
            if (unique_email){
                let user_obj = {"email":req.body.email, "password":req.body.password};
                user_JSON.Users[user_JSON.Users.length] = (user_obj);
                data_str = JSON.stringify(user_JSON);
                fs.writeFile('user-data.json', data_str, function(err) {
                    if(err) console.log('error', err);
                });
                res.redirect(307, "/todo");
            }
    }
});

class Task{
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

//Add a Task
app.post("/addtask", (req, res) => {
    var text = req.body.taskInfo;
    if (!text.length){
        res.redirect(307, "/todo");
    } else {
        var user = req.body.email;
        var task_data = fs.readFileSync("user-data.json");
        var task_JSON = JSON.parse(task_data);
        var task = new Task(
            task_JSON.Tasks.length,
            text,
            "New Task",
            user,
            false,
            "",
            false,
            false
        );
        task_JSON.Tasks[task_JSON.Tasks.length] = task;
        data_str = JSON.stringify(task_JSON);
        fs.writeFile('user-data.json', data_str, function(err) {
            if(err) console.log('error', err);
        });
        console.log(task);
        res.redirect(307, "/todo");
    }
});

//Claim a task
app.post("/claim", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_JSON = JSON.parse(task_data);
    var id = req.body.id;

    task_JSON.Tasks[id].isTaskClaimed = true;
    task_JSON.Tasks[id].claimingUser = req.body.email;

    data_str = JSON.stringify(task_JSON);
    fs.writeFile('user-data.json', data_str, function(err) {
        if(err) console.log('error', err);
    });
    res.redirect(307, "/todo");
});

//Abandon a task
app.post("/abandon", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_JSON = JSON.parse(task_data);
    var id = req.body.id;

    task_JSON.Tasks[id].isTaskClaimed = false;
    task_JSON.Tasks[id].claimingUser = "";

    data_str = JSON.stringify(task_JSON);
    fs.writeFile('user-data.json', data_str, function(err) {
        if(err) console.log('error', err);
    });
    res.redirect(307, "/todo");
});

//Update task to complete
app.post("/complete", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_JSON = JSON.parse(task_data);

    task_JSON.Tasks[req.body.id].isTaskDone = true;

    data_str = JSON.stringify(task_JSON);
    fs.writeFile('user-data.json', data_str, function(err) {
        if(err) console.log('error', err);
    });
    res.redirect(307, "/todo");
});

//Update task to uncomplete
app.post("/uncomplete", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_JSON = JSON.parse(task_data);

    task_JSON.Tasks[req.body.id].isTaskDone = false;

    data_str = JSON.stringify(task_JSON);
    fs.writeFile('user-data.json', data_str, function(err) {
        if(err) console.log('error', err);
    });
    res.redirect(307, "/todo");
});

//Remove all complete tasks
app.post("/purge", (req, res) => {
    var task_data = fs.readFileSync("user-data.json");
    var task_JSON = JSON.parse(task_data);
    var length = task_JSON.Tasks.length;

    for (var i = 0; i < length; i = i + 1){
        if(task_JSON.Tasks[i].isTaskDone){
            task_JSON.Tasks.splice(i, 1);
            length = task_JSON.Tasks.length;
            i = i - 1;
        }
    }

    var ID = 0;
    for(var taskID of task_JSON.Tasks){
        if(taskID != null){
            taskID.id = ID;
            ID = ID + 1;
        }
    }

    data_str = JSON.stringify(task_JSON);
    fs.writeFile('user-data.json', data_str, function(err) {
        if(err) console.log('error', err);
    });
    res.redirect(307, "/todo");
});



