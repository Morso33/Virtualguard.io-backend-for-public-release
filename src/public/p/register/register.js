let is_notif_running = false;

function isValidEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function disableLogin()
{
    document.getElementById("formRegister").style.opacity = "0.5";
    document.getElementById("formRegister").style.pointerEvents = "none";
}

function enableLogin()
{
    document.getElementById("formRegister").style.opacity = "1";
    document.getElementById("formRegister").style.pointerEvents = "auto";
}

function getCaptchaCompleted()
{
    return grecaptcha.getResponse().length > 0;
}

function doRegister()
{
    console.log("doRegister() called");
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    if (!email || !password)
    {
        throwNotification("Please fill in all fields", "white" ,"#14181f");
    }
    else if (!isValidEmail(email))
    {
        throwNotification("Please enter a valid email address", "white" ,"#14181f");
    }
    else if (password != password2)
    {
        throwNotification("Passwords do not match", "white" ,"#14181f");
    }
    else if (email.length < 6 || email.length > 50)
    {
        throwNotification("Email must be between 6 and 50 characters", "white" ,"#14181f");
    }
    else if (password.length < 6 || password.length > 50)
    {
        throwNotification("Password must be between 6 and 50 characters", "white" ,"#14181f");
    }
    else if (!getCaptchaCompleted())
    {
        throwNotification("Please complete the captcha", "white" ,"#14181f");
    }
    else
    {
        disableLogin();
        const data = {
            username: email,
            password: password,
            captcha_response: grecaptcha.getResponse(),
        };

        fetch("/API/V1/user/register", {
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
                        throwNotification("Account Created", "white", "#14181f");
                    setTimeout(() => {
                        window.location.href = "/p/login";
                    }, 1000);
                }
                else
                {
                    enableLogin();
                    grecaptcha.reset();
                    throwNotification(data.error, "white" ,"#14181f");
                }
            }, 100);
        })
    }
}

async function throwNotification(text, color, background)
{
    if (is_notif_running)
    {
        return;
    }
    is_notif_running = true;
    console.log("throwNotification() called");
    const notification = document.getElementById("notification");
    notification.textContent = text;
    notification.style.backgroundColor = background;
    notification.style.color = color;
    notification.style.opacity = "1";
    notification.style.animationName = "falling-text"
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.animationName = "none";
        is_notif_running = false;
    }, 2000);
}

document.getElementById("formRegister").addEventListener("submit", function(event) {
    event.preventDefault();
    doRegister()
});


enableLogin();