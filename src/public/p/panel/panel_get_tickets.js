function createTicket(ticketId, ticketTitle, responseCount, status) {
  const ticketListDiv = document.getElementById("ticketList");
  
  const ticketDiv = document.createElement("div");
  ticketDiv.classList.add("border-b", "border-gray-300", "py-4", "flex", "items-center", "justify-between");
  
  const ticketTitleDiv = document.createElement("div");
  
  const titleHeading = document.createElement("h4");
  titleHeading.classList.add("text-lg", "font-semibold", "text-gray-800", "dark:text-gray-300");
  titleHeading.textContent = `Ticket #${ticketId}: ${ticketTitle}`;
  
  const responseSpan = document.createElement("span");
  responseSpan.classList.add("text-sm", "font-medium", "text-gray-500", "dark:text-gray-400");
  responseSpan.textContent = `${responseCount} Responses`;
  
  ticketTitleDiv.appendChild(titleHeading);
  ticketTitleDiv.appendChild(responseSpan);
  ticketDiv.appendChild(ticketTitleDiv);
  
  const ticketInfoDiv = document.createElement("div");
  ticketInfoDiv.classList.add("flex", "items-center");
  
  const statusDiv = document.createElement("div");
  statusDiv.classList.add("inline-flex"); // Add this class to prevent the background color from extending beyond the bounds of the element
  const statusSpan = document.createElement("span");
  statusSpan.classList.add("bg-blue-500", "text-white", "rounded-full", "py-1", "px-3", "text-sm", "font-medium", "mr-2");
  switch (status) {
    case "Closed":
    statusSpan.style.background = "#DC2626"
    break;
    case "Awaiting staff reply":
    statusSpan.style.background = "#047857"
    break;
    case "Awaiting user reply":
    statusSpan.style.background = "#D97706"
    break;
    case "Awaiting staff assignment":
    statusSpan.style.background = "#2563EB"
    break;
    default:
    statusSpan.classList.remove("bg-green-100");
    statusSpan.classList.remove("text-green-800");
    statusSpan.classList.add("bg-purple-800");
    statusSpan.classList.add("text-white");
    break;
}
  statusSpan.textContent = status;
  statusDiv.appendChild(statusSpan);
  
  const ticketLinkDiv = document.createElement("div");
  ticketLinkDiv.classList.add("flex", "items-center", "ml-auto");
  
  const ticketLinkAnchor = document.createElement("a");
  ticketLinkAnchor.classList.add("text-sm", "font-medium", "text-blue-500", "hover:underline", "ml-2");
  ticketLinkAnchor.href = "ticket?id="+ticketId;
  ticketLinkAnchor.textContent = "View Ticket";
  ticketLinkDiv.appendChild(ticketLinkAnchor);
  
  ticketInfoDiv.appendChild(statusDiv);
  ticketInfoDiv.appendChild(ticketLinkDiv);
  ticketDiv.appendChild(ticketInfoDiv);
  
  ticketListDiv.appendChild(ticketDiv);
}


async function fetchTickets() {
  const response = await fetch("/API/V1/ticket/your_tickets", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  const response_json = await response.json();
  console.log(response_json);
  return response_json;
}


async function init()
{
  const tickets = await fetchTickets();
  if (tickets.status === "success")
  {
    document.getElementById("totalTickets").innerText = "Total tickets: " + tickets.data.length;
    if (tickets.data.length === 0)
    {
      const ticketListDiv = document.getElementById("ticketList");
      const noTicketsDiv = document.createElement("div");
      noTicketsDiv.classList.add("text-center", "py-4", "text-gray-500", "dark:text-gray-400");
      noTicketsDiv.textContent = "You have no tickets";
      ticketListDiv.appendChild(noTicketsDiv);
    }
    else
    {
      tickets.data.forEach(ticket => {
        createTicket(ticket.id, ticket.title, ticket.replies, ticket.state);
      });
    }
  }
}

init();