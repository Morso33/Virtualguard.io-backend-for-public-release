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

function checkForPlaceholder() {
    const inputElements = document.querySelectorAll('input[placeholder="ENTER_YOUR_VIRTUALGUARD_USERNAME"]');
    inputElements.forEach(input => {
      console.log('Found Purchase');
      autofill_username(input);
    });
  }
  
  // Function to traverse the DOM and check for the placeholder
  function observeDOMChanges() {
    const targetNode = document.body;
  
    const config = { childList: true, subtree: true };
  
    const observer = new MutationObserver(() => {
      checkForPlaceholder();
    });
  
    observer.observe(targetNode, config);
  }
  
  // Start observing the DOM changes
  observeDOMChanges();
  

async function autofill_username(input_object)
{
  if (input_object.value)
  {
    console.log(input_object.value)
    console.log("No username detected");
    return;
  }
    console.log(input_object);
    username_data = await get_username();
    if (username_data.status === "error")
    {
      showToast("Please fill in your username manually.", "info");
      return;
    }
    input_object.value = username_data.username;
    input_object.dispatchEvent(new Event('input', { bubbles: true }));
    input_object.parentElement.parentElement.style.display = "none";
}

async function get_username() {
    try {
        const response = await fetch("/API/V1/user/get_username");
        const data = await response.json();
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
    }
}

async function authenticate()
{
    try {
        const response = await fetch("/API/V1/user/authenticate");
        const data = await response.json();
        if (data.status === "success")
        {
            console.log("User is authenticated");
            return;
        }
        else
        {
            console.log("User is not authenticated");
            const buy_button_standard = document.querySelector('#buy_button_standard');
            const buy_button_premium = document.querySelector('#buy_button_premium');
            //Change action 
            buy_button_standard.setAttribute("onclick", "window.location.href='/p/login?goto=/#_pricing'");
            buy_button_premium.setAttribute("onclick", "window.location.href='/p/login?goto=/#_pricing'");
            return;
        }
    } catch (err) {
        console.log(err);
    }
}

authenticate();