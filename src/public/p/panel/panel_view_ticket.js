function unix_timestamp_to_date(timestamp, includeTime = true)
{
  //Is the user from the US? check cookie _vg_country_code
  const isUS = document.cookie.includes("_vg_country_code=US");
  
  if (isUS)
  {
    // use - instead of / in the date string
    var date = new Date(timestamp * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    
    // Will display time in 10:30:23 format
    if (includeTime)
    {
      var formattedTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    }
    else
    {
      var formattedTime = month + '-' + day + '-' + year;
    }
    return formattedTime;
  }
  else
  {
    // use / instead of - in the date string
    var date = new Date(timestamp * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    
    // Will display time in 10:30:23 format
    if (includeTime)
    {
      var formattedTime = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    }
    else
    {
      var formattedTime = day + '/' + month + '/' + year;
    }
    return formattedTime;
  }
}

function createReply(content, username, date, is_admin) {
    const repliesContainer = document.getElementById("replies");
    
    const replyDiv = document.createElement("div");
    replyDiv.classList.add("bg-gray-100", "dark:bg-gray-800", "rounded-lg", "p-4", "mb-4");
    
    const contentParagraph = document.createElement("p");
    contentParagraph.classList.add("text-gray-800", "dark:text-gray-100");
    contentParagraph.innerText = content;
    replyDiv.appendChild(contentParagraph);
    
    const replyDetailsDiv = document.createElement("div");
    replyDetailsDiv.classList.add("flex", "items-center", "mt-2");
    
    const usernameParagraph = document.createElement("p");
    usernameParagraph.classList.add("text-gray-600", "dark:text-gray-400", "text-xs");
    usernameParagraph.innerText = `Replied by: ${username} | Date added: ${date}`;
    replyDetailsDiv.appendChild(usernameParagraph);
    
    if (is_admin) {
        const adminIndicator = document.createElement("div");
        adminIndicator.classList.add("bg-red-600", "text-white", "rounded-full", "inline-block", "px-2", "py-1", "text-xs", "ml-2");
        adminIndicator.innerText = "ADMIN";
        adminIndicator.style.fontFamily = usernameParagraph.style.fontFamily;
        replyDetailsDiv.appendChild(adminIndicator);
    }
    
    replyDiv.appendChild(replyDetailsDiv);
    
    repliesContainer.appendChild(replyDiv);
}


async function reply(id, content)
{
    console.log("replying")
    const response = await fetch("/api/v1/ticket/reply", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id,
            content: content
        })
    });
    const response_json = await response.json();
    return response_json;
}

async function createReplyBox(ticketState) {
    const repliesContainer = document.getElementById("replies");
    
    const replyDiv = document.createElement("div");
    replyDiv.classList.add("bg-gray-100", "dark:bg-gray-800", "rounded-lg", "p-4", "mb-4");
    
    const replyInput = document.createElement("textarea");
    replyInput.classList.add("w-full", "border", "border-gray-300", "rounded-md", "p-2", "mb-2", "bg-gray-200", "dark:bg-gray-700", "text-gray-800", "dark:text-gray-100", "focus:outline-none", "focus:border-blue-500");
    replyInput.placeholder = "Type your reply here...";
    replyInput.rows = 8; // Set the initial number of rows to 3
    replyInput.style.resize = "none"; // Disable resizing by the user
    replyDiv.appendChild(replyInput);
    
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("flex", "justify-center", "space-x-4", "mb-2");
    
    const replyButton = document.createElement("button");
    replyButton.classList.add("bg-blue-500", "text-white", "rounded-md", "px-4", "py-2", "hover:bg-blue-600", "focus:outline-none", "focus:shadow-outline-blue");
    replyButton.innerText = "Reply";
    replyButton.id = "replyButton";
    
    const closeButton = document.createElement("button");
    closeButton.classList.add("bg-green-200", "text-white", "rounded-md", "px-4", "py-2", "hover:bg-red-600", "focus:outline-none", "focus:shadow-outline-red");
    closeButton.style.background = "green"
    closeButton.innerText = "Close Ticket";
    closeButton.id = "closeButton";
    buttonsContainer.appendChild(closeButton);
    buttonsContainer.appendChild(replyButton);
    
    replyDiv.appendChild(buttonsContainer);
    
    repliesContainer.appendChild(replyDiv);
    
    repliesContainer.appendChild(replyDiv);
    
    replyButton.addEventListener("click", () => {
        const content = replyInput.value;
        //get id
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        reply(id, content).then((response) => {
            console.log(response)
            
            if (response.status == "error")
            {
                console.log("Error occurred during reply")
                //delete all error divs
                const errorDivs = document.querySelectorAll("#errorDiv");
                errorDivs.forEach((errorDiv) => {
                    errorDiv.remove();
                });
                //Create a new error element under the reply box
                const errorDiv = document.createElement("div");
                errorDiv.classList.add("bg-red-300", "border", "border-red-600", "text-white", "px-4", "py-3", "rounded", "relative", "text-center", "mb-4");
                errorDiv.id = "errorDiv";
                
                const errorParagraph = document.createElement("p");
                errorParagraph.classList.add("text-sm");
                errorParagraph.innerText = response.error;
                errorDiv.appendChild(errorParagraph);
                //Insert before the reply button
                replyDiv.appendChild(errorDiv, replyButton);
                //Scroll to reply button
                replyButton.scrollIntoView();
                
            }
            else
            {
                //Delete the reply box
                replyDiv.remove();
                //refresh the page
                window.location.reload();
            }
        });
        
        
    }); 
    closeButton.addEventListener("click", () => {
        //get id
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        const response = fetch("/api/v1/ticket/close", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id
            })
        });
        console.log(response)
        
        window.location.reload();
    });
    if (ticketState)
    {
        if (ticketState == "Closed")
        {
            replyInput.disabled = true;
            replyButton.disabled = true;
            closeButton.disabled = true;
            replyInput.placeholder = "This ticket is closed, you cannot reply to it. Feel free to create a new ticket if your issue was not solved.";
            //colors
            replyButton.style.background = "gray"
            closeButton.style.background = "gray"
        }
    }
}


async function load_ticket()
{
    //Get the id to load from params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    //Request the ticket from the server
    const req = await fetch(`/API/V1/ticket/view_ticket?id=${id}`);
    const req_json = await req.json();
    
    console.log(req_json)
    
    
    if (req_json.status == "error")
    {
        console.log("Aborting load, fatal error occurred during fetch");
        console.log(req_json.error);
        //Redirect to 403
        window.location.href = "/error/403?reason=" + req_json.error;
    }
    
    //Update title
    document.getElementById("ticketTitle").innerText = `Ticket #${id} - ${req_json.data.original_ticket.title}`;
    
    //Create the original post element
    createReply(req_json.data.original_ticket.content, req_json.data.original_ticket.owned_by, unix_timestamp_to_date(req_json.data.original_ticket.created_at), false);
    
    //Create all the replies
    for (let i = 0; i < req_json.data.replies.length; i++)
    {
        const reply = req_json.data.replies[i];
        createReply(reply.content, reply.reply_user, unix_timestamp_to_date(reply.reply_time), reply.is_admin_reply);
    }
    return req_json;
}

async function init()
{
    const ticket_data = await load_ticket()
    await createReplyBox(ticket_data.data.original_ticket.state)
    await createAdminIndicator()
}

async function createAdminIndicator()
{
    const urlParams = new URLSearchParams(window.location.search);
    if (document.cookie.includes("_vg_is_admin=true"))
    {
        console.log("User is admin, creating indicator")
        //create an indicator inline with ticketTitle that floats to the right
        const adminIndicator = document.createElement("div");
        adminIndicator.classList.add("bg-red-600", "text-white", "inline-block", "px-2", "py-1", "text-m", "ml-2");
        adminIndicator.innerText = "ADMIN MODE";
        adminIndicator.style.fontFamily = "inherit";
        adminIndicator.style.float = "right";
        
        const ticketTitle = document.getElementById("ticketTitle");
        ticketTitle.appendChild(adminIndicator);
    }
}

init()