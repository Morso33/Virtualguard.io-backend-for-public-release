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


function check_reset_token()
{
    if (window.location.search === "")
    {
        window.location.href = "/p/forgot-password";
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const reset_token = urlParams.get('reset_token');
    if (reset_token === null)
    {
        window.location.href = "/p/forgot-password";
        return;
    }
}

function doResetPassword()
{
    //Get the new password
    const password = document.getElementById("new-password").value;
    const password_confirm = document.getElementById("confirm-password").value;
    const reset_token = new URLSearchParams(window.location.search).get('reset_token');
    if (password === "" || password_confirm === "")
    {
        throwNotification("Please enter a password", "white" ,"#14181f");
        return;
    }
    if (password !== password_confirm)
    {
        throwNotification("Passwords do not match", "white" ,"#14181f");
        return;
    }
    if (password.length < 6 || password.length > 50)
    {
        throwNotification("Password must be between 6 and 50 characters", "white" ,"#14181f");
        return;
    }
    //Call the HTTP GET
    fetch("/API/V1/user/client_password_reset_with_token", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reset_token: reset_token,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success")
        {
            throwNotification("Your password was reset succesfully", "white", "#14181f");
            //Play success audio
            const audio = new Audio("/p/panel/assets/sound/success_generic.mp3");
            audio.volume = 0.2;
            audio.play();
            setTimeout(() => {
                window.location.href = "/p/login";
            }, 3000);
        }
        else
        {
            throwNotification(data.error, "white", "#14181f");
        }
    })
}


document.getElementById("formSelectNewPassword").addEventListener("submit", function(event) {
    event.preventDefault();
    if (is_notif_running)
    {
        clearNotification();
        setTimeout(() => {
            doResetPassword();
        }, 1000);
    }
    else
    {
        doResetPassword()
    }
});


check_reset_token();