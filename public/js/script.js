
//Adding a new task
$("#add-task").click( () => {

    if ($("#add-task-input").val() != ""){

        var div = $("<div>", {"class":"input-group mb-3"});
        var input = $("<input>", {"class":"form-control", "disabled":"true", "value":$("#add-task-input").val()});
        var button = $("<button>", {"class":"btn btn-outline-secondary claim-button", "type":"button"});
        button.text("Claim");
        div.prepend(input);
        div.append(button);

        $("#to-do-list").prepend(div.hide().fadeIn());
        $("#add-task-input").val("");
    }

});

//Update task to claimed
$(document).on("click", ".claim-button", function () {

    $(this).text("Abandon");

    $(this).removeClass("claim-button");
    $(this).addClass("abandon-button");
        
    var div = $("<div>", {"class":"input-group-text"});
    div.append($("<input>", {"class":"form-check-input mt-0 complete-checkbox", "type":"checkbox", "value":""}));

    $(this).parent().prepend(div);
    
});

//Update claimed task to abandoned
$(document).on("click", ".abandon-button", function () {

    $(this).text("Claim");

    $(this).removeClass("abandon-button");
    $(this).addClass("claim-button");

    $(this).parent().children(".input-group-text").remove();

});

//Update task to completed
$(document).on("change", ".complete-checkbox", function () {

    $(this).attr("disabled", true);
    $(this).parent().parent().children(".form-control").addClass("text-decoration-line-through");
    $(this).parent().parent().children(".abandon-button").remove();
    $(this).parent().parent().addClass("completed-task");

});

//Removing all completed tasks
$("#remove-complete-tasks").click( function () {

    $(this).parent().parent().children(".completed-task").fadeOut(function(){
        $(this).remove();
    });

});