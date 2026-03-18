let is_notif_running = false;
let last_notif_timestamp = 0;

function clearNotification()
{
    if (last_notif_timestamp + 2000 > Date.now()) return;
    const notification = document.getElementById("notification");
    notification.style.animationPlayState = "running";
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.animationName = "";
        is_notif_running = false;
    }, 200);
}


function throwNotification(text, color, background)
{
    is_notif_running = true;
    last_notif_timestamp = Date.now();
    console.log("throwNotification() called");
    const notification = document.getElementById("notification");
    notification.textContent = text;
    notification.style.backgroundColor = background;
    notification.style.color = color;
    notification.style.opacity = "1";
    notification.style.animationName = "falling-text"
    setTimeout(() => {
        //Pause the notification mid animation
        notification.style.animationPlayState = "paused";
    }, 1600);
}


function sendResetPasswordEmail()
{
    const email = document.getElementById("email").value;
    if (email === "")
    {
        throwNotification("Please enter your email", "white" ,"#14181f");
        return;
    }

    //Call the HTTP
    fetch("/API/V1/user/request_password_reset", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success")
        {
            throwNotification("Password reset email sent", "white", "#14181f");
            //disable the button
            document.getElementById("buttonForgotPassword").disabled = true;
            //Grey filter the form
            document.getElementById("formForgotPassword").style.filter = "grayscale(0.5)";
        }
        else
        {
            throwNotification(data.error, "white", "#14181f");
        }
    })
}


document.getElementById("formForgotPassword").addEventListener("submit", function(event) {
    event.preventDefault();
    if (is_notif_running)
    {
        clearNotification();
        setTimeout(() => {
            sendResetPasswordEmail();
        }, 1000);
    }
    else
    {
        sendResetPasswordEmail()
    }
});
