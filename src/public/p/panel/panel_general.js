function showToast(message, type)
{
    toastr.options = {
        "closeButton": true,
        "positionClass": "toast-bottom-left",
        "preventDuplicates": true,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "progressBar": true,
    }
    toastr[type](message);
}


async function verify_auth()
{
    console.log("panel_general.js: Authentication query")
    //Is the user logged in?
    if (!document.cookie.includes("_vg_logged_in")) {
        //Redirect
        window.location.href = "/p/login?message=You must login to access this page&goto=" + window.location.pathname;
    }
    //Authorize with the server using GET
    const auth_request = await fetch("/api/v1/user/authenticate", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const auth_response = await auth_request.json();
    if (auth_response.status === "error") {
        //The user is not logged in. Redirect to login page.
        console.log("panel_general.js: Authentication query requesting re-authentication")
        window.location.href = "/p/login?message=" + auth_response.error + "&goto=" + window.location.pathname + window.location.search;
    }
    console.log("panel_general.js: Authentication query successful")
}

async function show_admin_panel()
{
    //Is vg_is_admin cookie true
    if (document.cookie.includes("_vg_is_admin=true")) {
        console.log("panel_general.js: User is admin, showing admin panel")
        document.getElementById("adminButton").style.visibility = "visible";
    }
}
verify_auth();
show_admin_panel();