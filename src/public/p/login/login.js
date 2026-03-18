let is_notif_running = false;
let last_notif_timestamp = 0;

function isValidEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function get_param(param)
{
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


function disableLogin()
{
    document.getElementById("formLogin").style.opacity = "0.5";
    document.getElementById("formLogin").style.pointerEvents = "none";
}

function enableLogin()
{
    document.getElementById("formLogin").style.opacity = "1";
    document.getElementById("formLogin").style.pointerEvents = "auto";
    //If query string goto
    if (get_param("goto"))
    {
        //If the path is not just "/"
        if (get_param("goto") != "/")
        {
            document.getElementById("redirectToNotification").textContent = "Redirecting to " + get_param("goto");
        }
    }
}

function doLogin()
{
    console.log("doLogin() called");
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rememberUser = document.getElementById("remember").checked;
    
    if (!email || !password)
    {
        throwNotification("Please fill in all fields", "white" ,"#14181f");
        enableLogin();
    }
    else if (!isValidEmail(email))
    {
        throwNotification("Please enter a valid email address", "white" ,"#14181f");
        enableLogin();
    }
    else if (email.length < 6 || email.length > 50)
    {
        throwNotification("Email must be between 6 and 50 characters", "white" ,"#14181f");
        enableLogin();
    }
    else if (password.length < 6 || password.length > 50)
    {
        throwNotification("Password must be between 6 and 50 characters", "white" ,"#14181f");
        enableLogin();
    }
    else
    {
        disableLogin();
        const data = {
            username: email,
            password: password,
            rememberUser: rememberUser
        };
        
        fetch("/API/V1/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            setTimeout(() => {
                if (data.status == "success")
                {
                    throwNotification("Logged in", "white", "#14181f");
                    setTimeout(() => {
                        //end notification animation
                        clearNotification();
                        enableLogin();
                        performRedirect()
                    }, 1000);
                }
                else
                {
                    enableLogin();
                    throwNotification(data.error, "white" ,"#14181f");
                }
            }, 100);
        })
        .catch((error) => {
            enableLogin();
            throwNotification("An error occured", "white" ,"#14181f");
        });
    }
}

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

document.getElementById("formLogin").addEventListener("submit", function(event) {
    event.preventDefault();
    disableLogin();
    if (is_notif_running)
    {
        clearNotification();
        setTimeout(() => {
            doLogin();
        }, 1000);
    }
    else
    {
        doLogin()
    }
});

//Add an event listener to every single input field
const inputs = document.getElementsByTagName("input");
for (let i = 0; i < inputs.length; i++)
{
    inputs[i].addEventListener("input", function() {
        if (is_notif_running)
        {
            clearNotification();
        }
    });
}

//Add an event listener to the notification
document.getElementById("notification").addEventListener("click", function() {
    clearNotification();
});


//Does a ?message= query exist?
if (get_param("message"))
{
    throwNotification(get_param("message"), "white", "#14181f");
    //Clear the message from the URL, without affecting other query strings
    const url = new URL(window.location.href);
    url.searchParams.delete("message");
    window.history.replaceState({}, document.title, url);
}

async function already_logged_in()
{
    if (!document.cookie.includes("_vg_logged_in"))
    {
        return false;
    }
    const response = await fetch("/API/V1/user/authenticate", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = await response.json();
    if (data.status == "success")
    {
        //Already logged in
        performRedirect()
    }
    else
    {
        return false;
    }
}

function performRedirect() {
    let goTo = get_param("goto");
    let fragment = window.location.hash; // Get the current fragment
    
    if (goTo) {
        window.location.href = goTo + fragment; // Include the fragment in the redirect URL
    } else {
        window.location.href = "/p/panel";
    }
}

//Check if the user is already logged in


already_logged_in();
enableLogin();
