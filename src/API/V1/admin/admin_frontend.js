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


function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function unixToDateTime(unix_timestamp) {
  const date = new Date(unix_timestamp * 1000);
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hour = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  return `${day}/${month}/${year} ${hour}:${minutes}`;
}

function isSameTime(time1, time2) {
  return (
    time1.getHours() === time2.getHours() &&
    Math.floor(time1.getMinutes() / 10) === Math.floor(time2.getMinutes() / 10)
  );
}



async function generate24HourRequestGraph() {
  const response = await fetch("/admin/get_request_data");
  const json = await response.json();
  const requests = json.requests;

  const uniqueIPs = new Set(); // To track unique IP addresses

  const now = new Date(); // Get current date and time
  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const labels = [];
  const realData = [];
  const fakeData = [];
  const uniqueVisitorsData = []; // New array for unique visitors

  const ipLastRequestDates = {};

  for (let i = new Date(twentyFourHoursAgo); i <= now; i.setHours(i.getHours() + 1)) {
    const formattedTime = i.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    labels.push(formattedTime);

    const hourRequests = requests.filter((request) => {
      const requestDate = new Date(request.request_timestamp * 1000);
      return isSameHour(i, requestDate);
    });

    const realCount = hourRequests.filter((request) => request.request_trust_score >= 50).length;
    const fakeCount = hourRequests.filter((request) => request.request_trust_score < 50).length;

    realData.push(realCount);
    fakeData.push(fakeCount);

    const ipRequests = hourRequests.filter((request) => {
      const lastRequestDate = ipLastRequestDates[request.ip];
      if (!lastRequestDate || !isSameHour(i, lastRequestDate)) {
        ipLastRequestDates[request.ip] = i;
        uniqueIPs.add(request.ip); // Add IP to the set of unique IPs
        return true;
      }
      return false;
    });

    const uniqueVisitorsCount = ipRequests.filter(
      (request) => request.request_trust_score >= 50
    ).length;
    uniqueVisitorsData.push(uniqueVisitorsCount);
  }

  var ctx = document.getElementById("graph24h").getContext("2d");
  var chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Real Requests",
          data: realData,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: false,
        },
        {
          label: "Fake Requests",
          data: fakeData,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          fill: false,
        },
        {
          label: "Unique Real Requests",
          data: uniqueVisitorsData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
      elements: {
        line: {
          tension: 0,
        },
      },
      plugins: {
        tooltip: {
          mode: "index", // Display tooltips for all data points in the same index (same hour)
          intersect: false, // Allow tooltips to show for overlapping points
        },
      },
    },
  });

  const totalRealCount = realData.reduce((acc, value) => acc + value, 0);
  const totalFakeCount = fakeData.reduce((acc, value) => acc + value, 0);
  
  const totalUniqueVisitors = uniqueVisitorsData.reduce((acc, value) => acc + value, 0);
  
  const dayRequestsElement = document.getElementById("dayRequests");
  dayRequestsElement.innerHTML +=
    "<br>Total: " + (totalRealCount + totalFakeCount) +
    "<br>Real: " + totalRealCount +
    "<br>Fake: " + totalFakeCount +
    "<br>Ratio: " + (((totalRealCount / (totalRealCount + totalFakeCount)) * 100).toFixed(2)) + "%" +
    "<br>Unique IPs: " + uniqueIPs.size +
    "<br>Unique Real: " + totalUniqueVisitors;
}

function isSameHour(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate() &&
    date1.getHours() === date2.getHours()
  );
}



async function generateOneYearRequestsGraph() {
  const response = await fetch("/admin/get_request_data");
  const json = await response.json();
  const requests = json.requests;

  const uniqueIPs = new Set(); // To track unique IP addresses

  const today = new Date(); // Get today's date
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const labels = [];
  const realData = [];
  const fakeData = [];
  const uniqueVisitorsData = []; // New array for unique visitors

  const ipLastRequestDates = {};

  for (let i = oneYearAgo; i <= today; i.setMonth(i.getMonth() + 1)) {
    const formattedDate = i.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    labels.push(formattedDate);

    const monthRequests = requests.filter((request) => {
      const requestDate = new Date(request.request_timestamp * 1000);
      return isSameMonth(i, requestDate);
    });

    const realCount = monthRequests.filter((request) => request.request_trust_score >= 50).length;
    const fakeCount = monthRequests.filter((request) => request.request_trust_score < 50).length;

    realData.push(realCount);
    fakeData.push(fakeCount);

    const ipRequests = monthRequests.filter((request) => {
      const lastRequestDate = ipLastRequestDates[request.ip];
      if (!lastRequestDate || !isSameMonth(i, lastRequestDate)) {
        ipLastRequestDates[request.ip] = i;
        uniqueIPs.add(request.ip); // Add IP to the set of unique IPs
        return true;
      }
      return false;
    });

    const uniqueVisitorsCount = ipRequests.filter(
      (request) => request.request_trust_score >= 50
    ).length;
    uniqueVisitorsData.push(uniqueVisitorsCount);
  }

  var ctx = document.getElementById("graph1y").getContext("2d");
  var chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Real Requests",
          data: realData,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: false,
          
        },
        {
          label: "Fake Requests",
          data: fakeData,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          fill: false,
        },
        {
          label: "Unique Real Requests",
          data: uniqueVisitorsData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
      elements: {
        line: {
          tension: 0,
        },
      },
      plugins: {
        tooltip: {
          mode: 'index', // Display tooltips for all data points in the same index (same date)
          intersect: false, // Allow tooltips to show for overlapping points
        },
      },
    },
  });

  const yearRequestsElement = document.getElementById("yearRequests");
  yearRequestsElement.innerHTML +=
    "<br>Total: " + requests.length +
    "<br>Real: " + realData.reduce((acc, value) => acc + value, 0) +
    "<br>Fake: " + fakeData.reduce((acc, value) => acc + value, 0) +
    "<br>Ratio: " + (((realData.reduce((acc, value) => acc + value, 0) / requests.length) * 100).toFixed(2)) + "%" +
    "<br>Unique IPs: " + uniqueIPs.size +
    "<br>Unique Real: " + uniqueVisitorsData.reduce((acc, value) => acc + value, 0);
  console.log(uniqueIPs);
}

function isSameMonth(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}



async function generate7DayGraph() {
  const response = await fetch("/admin/user_statistics");
  const json = await response.json();
  const signup_timestamps = json.signup_timestamps;

  document.getElementById("last7DayRegisters").innerHTML +=
    " | avg " +
    (await get_signups_for_days(signup_timestamps, 7)).toFixed(2) +
    " per day";

  var ctx = document.getElementById("graphRegisteredUsers7D").getContext("2d");
  var today = new Date(); // Get today's date
  var labels = []; // Array to hold the labels
  var data = []; // Array to hold the data

  // Generate the last 7 days' dates and add them to the labels array
  for (var i = 6; i >= 0; i--) {
    var date = new Date(today);
    date.setDate(date.getDate() - i);
    var formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    labels.push(formattedDate);

    // Count the number of signups for each day
    const count = signup_timestamps.filter((timestamp) =>
      isSameDay(date, new Date(timestamp.created_at * 1000))
    ).length;
    data.push(count);
  }

  // Create the chart
  var chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Signups",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
      elements: {
        line: {
          tension: 0,
        },
      },
    },
  });
}

async function get_signups_for_days(signup_timestamp, days) {
  //filter out all timestamps that are older than the days unix timestamp
  const filtered_timestamps = signup_timestamp.filter(
    (timestamp) =>
      timestamp.created_at >=
      Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
  );
  //return the average signups per day
  return filtered_timestamps.length / days;
}

async function generate30DayGraph() {
  const response = await fetch("/admin/user_statistics");
  const json = await response.json();
  const signup_timestamps = json.signup_timestamps;
  console.log(signup_timestamps);

  //filter all timestamps that are older than 30 days

  document.getElementById("last30DayRegisters").innerHTML +=
    " | avg " +
    (await get_signups_for_days(signup_timestamps, 30)).toFixed(2) +
    " per day";

  var ctx = document.getElementById("graphRegisteredUsers30D").getContext("2d");
  var today = new Date(); // Get today's date
  var labels = []; // Array to hold the labels
  var data = []; // Array to hold the data

  // Generate the last 30 days' dates and add them to the labels array
  for (var i = 29; i >= 0; i--) {
    var date = new Date(today);
    date.setDate(date.getDate() - i);
    var formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    labels.push(formattedDate);

    // Count the number of signups for each day
    const count = signup_timestamps.filter((timestamp) =>
      isSameDay(date, new Date(timestamp.created_at * 1000))
    ).length;
    data.push(count);
  }

  // Create the chart
  var chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Signups",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
      elements: {
        line: {
          tension: 0,
        },
      },
    },
  });
}

function createUser(
  id,
  username,
  ip,
  isBanned,
  accountCreatedAge,
  subType,
  totalFiles,
  showOnly = false
) {
  const usersContainer = document.querySelector("#usersContainer");

  const newRow = document.createElement("tr");
  newRow.classList.add("text-gray-700", "dark:text-gray-400");

  console.log(
    "creating user " +
      id +
      ", ip:" +
      ip +
      ", isBanned:" +
      isBanned +
      ", accountCreatedAge:" +
      accountCreatedAge +
      ", subType:" +
      subType +
      ", totalFiles:" +
      totalFiles
  );
  const rowData = [
    id,
    username,
    ip,
    isBanned,
    accountCreatedAge,
    subType,
    totalFiles,
  ];

  rowData.forEach((data) => {
    const cell = document.createElement("td");
    cell.classList.add("px-4", "py-3");
    cell.textContent = data;
    //href on id
    if (data == id && !showOnly) {
      const link = document.createElement("a");
      link.href = "/admin?page=admin_view_user&user_id=" + id;
      link.textContent = data;
      cell.textContent = "";
      //blue
      link.classList.add(
        "font-semibold",
        "text-blue-600",
        "hover:text-blue-800",
        "dark:text-blue-400",
        "dark:hover:text-blue-600",
        "text-decoration:underline"
      );
      link.style.textDecoration = "underline";
      cell.appendChild(link);
    }
    newRow.appendChild(cell);
  });

  usersContainer.appendChild(newRow);
}

async function setUserTitleOnViewUserPage(name)
{
  document.getElementById("userTitle").textContent = name;
}

async function createUsersTable(users_raw) {
  const users = users_raw.users;
  for (var i = 0; i < users.length; i++) {
    const id = users[i].id;
    const username = users[i].username;
    const ip = users[i].session_ip;
    const isBanned = users[i].is_banned;
    const accountCreatedAge = users[i].created_at;
    const subType = users[i].license_type;
    const totalFiles = users[i].total_files_protected;
    let subTypeParsed = "";
    switch (subType) {
      case 0:
        subTypeParsed = "Free";
        break;
      case 1:
        subTypeParsed = "VirtualGuard";
        break;
      case 2:
        subTypeParsed = "VirtualGuard+";
        break;
      default:
        subTypeParsed = "Unknown";
        break;
    }

    createUser(
      id,
      username,
      ip,
      isBanned ? "true" : "false",
      unixToDateTime(accountCreatedAge),
      subTypeParsed,
      totalFiles
    );
  }
}

async function createTicketTable(tickets_raw) {
  const tickets = tickets_raw.tickets;
  for (var i = 0; i < tickets.length; i++) {
    console.log(tickets[i]);
    const id = tickets[i].id;
    const title = tickets[i].title;
    const replies = tickets[i].replies;
    const created_at = tickets[i].created_at;
    const updated_at = tickets[i].updated_at;
    const state = tickets[i].state;
    const assigned_to = tickets[i].assigned_to;
    const category = tickets[i].category;

    createTicket(
      id,
      title,
      replies,
      created_at,
      updated_at,
      state,
      assigned_to,
      category
    );
  }
}

function createTicket(
  id,
  title,
  replies,
  created,
  lastResponse,
  state,
  assignee,
  category
) {
  const ticketRow = document.createElement("tr");
  ticketRow.classList.add("text-gray-700", "dark:text-gray-400");

  const idCell = document.createElement("td");
  idCell.classList.add("px-4", "py-3");
  const idLink = document.createElement("a");
  idLink.classList.add(
    "font-semibold",
    "text-blue-600",
    "hover:text-blue-800",
    "dark:text-blue-400",
    "dark:hover:text-blue-600",
    "hover:underline"
  );
  idLink.href = "/p/panel/ticket?id=" + id;
  idLink.textContent = "#" + id;
  idCell.appendChild(idLink);

  const titleCell = document.createElement("td");
  titleCell.classList.add("px-4", "py-3");
  titleCell.textContent = title;

  const repliesCell = document.createElement("td");
  repliesCell.classList.add("px-4", "py-3");
  repliesCell.textContent = replies;

  const createdCell = document.createElement("td");
  createdCell.classList.add("px-4", "py-3");
  createdCell.textContent = unixToDateTime(created);

  const lastResponseCell = document.createElement("td");
  lastResponseCell.classList.add("px-4", "py-3");
  lastResponseCell.textContent = unixToDateTime(lastResponse);

  const stateCell = document.createElement("td");
  stateCell.classList.add("px-4", "py-3");
  const stateSpan = document.createElement("span");
  stateSpan.classList.add(
    "px-2",
    "inline-flex",
    "text-xs",
    "leading-5",
    "font-semibold",
    "rounded-full",
    "bg-green-100",
    "text-green-800"
  );
  stateSpan.textContent = state;
  stateCell.appendChild(stateSpan);

  //change color depending on state
  switch (state) {
    case "Closed":
      stateSpan.classList.remove("bg-green-100");
      stateSpan.classList.remove("text-green-800");
      stateSpan.classList.add("bg-red-600");
      stateSpan.classList.add("text-white");
      break;
    case "Awaiting staff reply":
      stateSpan.classList.remove("bg-green-100");
      stateSpan.classList.remove("text-green-800");
      stateSpan.classList.add("bg-green-600");
      stateSpan.classList.add("text-white");
      break;
    case "Awaiting user reply":
      stateSpan.classList.remove("bg-green-100");
      stateSpan.classList.remove("text-green-800");
      stateSpan.classList.add("bg-yellow-600");
      stateSpan.classList.add("text-white");
      break;
    case "Awaiting staff assignment":
      stateSpan.classList.remove("bg-green-100");
      stateSpan.classList.remove("text-green-800");
      stateSpan.classList.add("bg-blue-600");
      stateSpan.classList.add("text-white");
      break;
    default:
      stateSpan.classList.remove("bg-green-100");
      stateSpan.classList.remove("text-green-800");
      stateSpan.classList.add("bg-purple-800");
      stateSpan.classList.add("text-white");
      break;
  }

  const assigneeCell = document.createElement("td");
  assigneeCell.classList.add("px-4", "py-3");
  assigneeCell.textContent = assignee;

  const categoryCell = document.createElement("td");
  categoryCell.classList.add("px-4", "py-3");
  categoryCell.textContent = category;

  ticketRow.appendChild(idCell);
  ticketRow.appendChild(titleCell);
  ticketRow.appendChild(repliesCell);
  ticketRow.appendChild(createdCell);
  ticketRow.appendChild(lastResponseCell);
  ticketRow.appendChild(stateCell);
  ticketRow.appendChild(assigneeCell);
  ticketRow.appendChild(categoryCell);

  const ticketContainer = document.getElementById("ticketContainer");
  ticketContainer.appendChild(ticketRow);
}

async function get_tickets_list() {
  const ticket_page = getParamByName("ticket_page")
    ? getParamByName("ticket_page")
    : 0;
  const category = getParamByName("ticket_category")
    ? getParamByName("ticket_category")
    : "%";

  const response = await fetch(
    "/admin/ticket_list?ticket_page=" +
      ticket_page +
      "&ticket_category=" +
      category
  );
  const json = await response.json();
  console.log(json);
  return json;
}

async function createTicketCategorySelector() {
  //create next to #adminTicketsHeader
  const categorySelectorDiv = document.createElement("div");
  categorySelectorDiv.style.display = "inline";
  categorySelectorDiv.style.float = "right";
  categorySelectorDiv.style.fontSize = "14px"; // Adjust font size
  categorySelectorDiv.style.marginLeft = "8px"; // Adjust margin

  const categorySelectorLabel = document.createElement("label");
  categorySelectorLabel.textContent = "Category:";
  categorySelectorLabel.style.marginRight = "4px"; // Adjust margin
  categorySelectorLabel.style.alignSelf = "flex-start"; // Align label to the top

  categorySelectorDiv.appendChild(categorySelectorLabel);

  const categorySelector = document.createElement("select");
  categorySelector.classList.add(
    "border",
    "text-gray-700",
    "py-1",
    "px-2",
    "rounded",
    "focus:outline-none",
    "focus:border-gray-500"
  ); // Adjusted styles
  categorySelector.style.alignSelf = "flex-start"; // Align select box to the top
  categorySelector.id = "ticketCategorySelector";

  const options = [
    { value: "%", label: "All" },
    { value: "General", label: "General" },
    { value: "Account", label: "Account" },
    { value: "Other", label: "Other" },
  ];

  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    categorySelector.appendChild(option);
  });

  categorySelector.addEventListener("change", function () {
    window.location.href =
      "/admin?page=admin_tickets&ticket_category=" + categorySelector.value;
  });

  categorySelectorDiv.appendChild(categorySelector);

  //force to current value
  categorySelector.value = getParamByName("ticket_category");

  //If not set, set to all
  if (!categorySelector.value) {
    categorySelector.value = "%";
  }

  document
    .getElementById("adminTicketsHeader")
    .appendChild(categorySelectorDiv);
}
async function createTicketPageSelector(totalPages) {
  const itemsPerPage = 100;

  const pageSelectorDiv = document.createElement("div");
  pageSelectorDiv.style.display = "inline";
  pageSelectorDiv.style.float = "right";
  pageSelectorDiv.style.fontSize = "14px";

  const pageSelectorLabel = document.createElement("label");
  pageSelectorLabel.textContent = "Page:";
  pageSelectorLabel.style.marginRight = "4px";
  pageSelectorLabel.style.alignSelf = "flex-start";
  pageSelectorDiv.appendChild(pageSelectorLabel);

  const pageSelector = document.createElement("select");
  pageSelector.classList.add(
    "border",
    "text-gray-700",
    "py-1",
    "px-2",
    "rounded",
    "focus:outline-none",
    "focus:border-gray-500"
  );
  pageSelector.style.alignSelf = "flex-start";
  pageSelector.id = "ticketCategorySelector";

  pageSelector.addEventListener("change", function () {
    const selectedPage = parseInt(pageSelector.value);
    window.location.href = `/admin?page=admin_tickets&ticket_page=${selectedPage}`;
  });

  pageSelectorDiv.appendChild(pageSelector);

  const totalPagesToShow = Math.ceil(totalPages / itemsPerPage);
  for (let i = 1; i <= totalPagesToShow; i++) {
    const option = document.createElement("option");
    option.value = i - 1;
    option.textContent = `Page ${i}`;
    pageSelector.appendChild(option);
  }

  //force to current value
  pageSelector.value = parseInt(getParamByName("ticket_page"));

  //if not set, set to 0
  if (!pageSelector.value) {
    pageSelector.value = 0;
  }

  document.getElementById("adminTicketsHeader").appendChild(pageSelectorDiv);
}

async function updateTicketsCount(tickets, tickets_total) {
  console.log(tickets);
  const tickets_amount = tickets.tickets.length;
  document.getElementById("totalTicketAmount").textContent =
    "Showing " + tickets_amount + " of " + tickets_total + " tickets";
}

async function updateUsersCount(users_showing, users_total) {
  console.log("showing: " + users_showing + ", total: " + users_total);
  document.getElementById("totalUsersAmount").textContent =
    "Showing " + users_showing + " of " + users_total + " users";
}

async function get_users_list() {
  const response = await fetch("/admin/get_all_users");
  const json = await response.json();
  console.log(json);
  return json;
}

function getParamByName(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function updateSearchUserInput(input)
{
  document.getElementById("searchForUsers").value = input;
  //callback input event
  const event = new Event('input');
  document.getElementById("searchForUsers").dispatchEvent(event);
}

function setupUserSearch() {
  const searchInput = document.getElementById("searchForUsers");

  searchInput.addEventListener("input", function () {
    const searchValue = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#usersContainer tr");

    rows.forEach((row) => {
      const username = row.children[1].textContent.toLowerCase();
      const userId = row.children[0].textContent.toLowerCase();
      if (username.includes(searchValue) || userId.includes(searchValue)) {
        row.style.display = "";
        if (username.includes(searchValue)) {
          console.log(`User found by username: ${username}`);
        } else {
          console.log(`User found by ID: ${userId}`);
        }
      } else {
        row.style.display = "none";
      }
    });

    updateUsersCount(
      document.querySelectorAll("#usersContainer tr:not([style*='display: none'])").length,
      document.querySelectorAll("#usersContainer tr").length
    );
  });
}

  async function get_user_data(user_id) {
    const response = await fetch("/admin/get_user?user_id=" + user_id);
    const json = await response.json();
    console.log(json);
    return json;
  }

async function runAction(action, user_id)
//run an action on a user
{
  console.log("running action " + action + " on user " + user_id);
  const response = await fetch("/admin/run_action?user_id=" + user_id + "&action=" + action);
  const json = await response.json();
  console.log(json);
  //update to include all data
  document.getElementById("adminAction_response").value = response.status + " " + response.statusText + "\n" + JSON.stringify(json);
  //refresh the user data
  clearUsersTable();
  const user = await get_user_data(user_id);
  createUser(
    user.user.id,
    user.user.username,
    user.user.session_ip,
    user.user.is_banned,
    unixToDateTime(user.user.created_at),
    user.user.license_type,
    user.user.total_files_protected,
    true
  );
}

function clearUsersTable()
//clear the users table
{
  const usersContainer = document.querySelector("#usersContainer");
  usersContainer.innerHTML = "";
}

async function setUserActionListener()
//setup an event listener to the div #userActionSelector. It has multiple buttons inside. console log the active button
{
  const userActionSelector = document.getElementById("userActionSelector");
  userActionSelector.addEventListener("click", function (e) {
    if (e.target.value == undefined) return;
    if (e.target.value != "execute")
    {
    updateUserActionText(e.target.value);
    }
    console.log(e.target.value);

    if (e.target.value == "execute") {
      console.log("executing action");
      document.getElementById("adminAction_response").value = "working..."
        runAction(getCurrentActionText(), getParamByName("user_id"));
    }
  });
}

function getCurrentActionText()
//get the text of the user action selector
{
  console.log("returned: " + document.getElementById("selectedAction").textContent);
  return document.getElementById("selectedAction").textContent;
}


async function updateUserActionText(text)
//update the text of the user action selector
{
  document.getElementById("selectedAction").textContent = text;
}

async function determinePage(page) {
  switch (page) {
    case "admin_statistics":
      const response = await fetch("/admin/user_statistics");
      const json = await response.json();
      if (json.error)
      {
        showToast(json.error, "error");
        return;
      }
      generate30DayGraph();
      generate7DayGraph();
      generate24HourRequestGraph()
      generateOneYearRequestsGraph()
      break;
    case "admin_tickets":
      const category = getParamByName("category");
      const tickets = await get_tickets_list(category);
      createTicketTable(tickets);
      updateTicketsCount(tickets, tickets.tickets_amount);
      createTicketCategorySelector();
      createTicketPageSelector(tickets.tickets_amount);
      break;
    case "admin_users":
      const users = await get_users_list();
      if (users.error)
      {
        showToast(users.error, "error");
        return;
      }
      createUsersTable(users);
      console.log(users.users.length);
      updateUsersCount(users.users.length, users.users.length);
      setupUserSearch();
      if (getParamByName("search")) {
        updateSearchUserInput(getParamByName("search"));
      }
      break;
    case "admin_view_user":
      const user = await get_user_data(getParamByName("user_id"));
      if (user.error)
      {
        showToast(user.error, "error");
        return;
      }
      setUserTitleOnViewUserPage(user.user.username);
      createUser(
        user.user.id,
        user.user.username,
        user.user.session_ip,
        user.user.is_banned,
        unixToDateTime(user.user.created_at),
        user.user.license_type,
        user.user.total_files_protected,
        true
      );
      setUserActionListener();
        break;
        default:
          //This is the admin home page
          console.log("admin home page");
          update_runtime_log()
          set_runtime_log_button()
          update_server_info()
          set_server_info_button()
  }
}

async function update_runtime_log()
{
  try
  {
  document.getElementById("refreshLogButton").disabled = true;
  document.getElementById("refreshLogButton").style.backgroundColor = "grey";
  const start_time = new Date();
  runtime_log = await fetch("/admin/get_runtime_log");
  runtime_log = await runtime_log.json();
  if (runtime_log.status != "success")
  {
    showToast(runtime_log.error, "error");
    //Set the button
    document.getElementById("refreshLogButton").textContent = "Error!";
    document.getElementById("refreshLogButton").style.backgroundColor = "red";
    //Restore
    setTimeout(function() {
      document.getElementById("refreshLogButton").textContent = "Refresh";
      document.getElementById("refreshLogButton").style.backgroundColor = "blue";
      document.getElementById("refreshLogButton").disabled = false;
    }, 2000);
    return;
  }
  const end_time = new Date();
  document.getElementById("runtime_log").value = runtime_log.runtime_log
  document.getElementById("refreshLogButton").textContent = "OK (" + (end_time - start_time) + "ms)";
  setTimeout(function() {
    document.getElementById("refreshLogButton").textContent = "Refresh";
    document.getElementById("refreshLogButton").style.backgroundColor = "blue";
    document.getElementById("refreshLogButton").disabled = false;
  }, 1000);
  }
  catch (e)
  {
    showToast(e, "error");
    //Set the button
    document.getElementById("refreshLogButton").textContent = "Error!";
    document.getElementById("refreshLogButton").style.backgroundColor = "red";
    //Restore
    setTimeout(function() {
      document.getElementById("refreshLogButton").textContent = "Refresh";
      document.getElementById("refreshLogButton").style.backgroundColor = "blue";
      document.getElementById("refreshLogButton").disabled = false;
    }, 2000);
    return;
  }
}

async function set_runtime_log_button()
{
  document.getElementById("refreshLogButton").addEventListener("click", function() {
    update_runtime_log();
  });
}

async function set_server_info_button()
{
  document.getElementById("refreshServerInfoButton").addEventListener("click", function() {
    update_server_info();
  });
}

async function update_server_info()
{
  try
  {
  document.getElementById("refreshServerInfoButton").disabled = true;
  document.getElementById("refreshServerInfoButton").style.backgroundColor = "grey";
  const start_time = new Date();
  server_info = await fetch("/admin/get_server_info");
  server_info = await server_info.json();

  if (server_info.status != "success")
  {
    showToast(server_info.error, "error");
    //Set the button
    document.getElementById("refreshServerInfoButton").textContent = "Error!";
    document.getElementById("refreshServerInfoButton").style.backgroundColor = "red";
    //Restore
    setTimeout(function() {
      document.getElementById("refreshServerInfoButton").textContent = "Refresh";
      document.getElementById("refreshServerInfoButton").style.backgroundColor = "blue";
      document.getElementById("refreshServerInfoButton").disabled = false;
    }, 2000);
    return;
  }

  //OK, render
  const textArea = document.getElementById("server_info");

  textArea.value = "Server Info:\n";
  textArea.value += "Deployment: " + server_info.deployment + "\n";
  textArea.value += "--General--\n";
  textArea.value += "OS: " + server_info.OS + "\n";
  textArea.value += "Uptime: " + server_info.up_time + "\n";
  textArea.value += "Node Version: " + server_info.node_version + "\n";
  //unix timestamp to date
  textArea.value += "Server Time: " + unixToDateTime(server_info.server_time) + "\n";
  textArea.value += "--Load--\n";
  textArea.value += "CPU Usage: " + Math.floor(server_info.current_cpu) + "%\n";
  textArea.value += "Memory Usage: " + Math.floor(server_info.used_memory_percentage) + "%\n";

  const end_time = new Date();
  //All Done
  document.getElementById("refreshServerInfoButton").textContent = "OK (" + (end_time - start_time) + "ms)";
  setTimeout(function() {
    document.getElementById("refreshServerInfoButton").textContent = "Refresh";
    document.getElementById("refreshServerInfoButton").style.backgroundColor = "blue";
    document.getElementById("refreshServerInfoButton").disabled = false;
  }, 1000);
  }
  catch (e)
  {
    showToast(e, "error");
    //Set the button
    document.getElementById("refreshServerInfoButton").textContent = "Error!";
    document.getElementById("refreshServerInfoButton").style.backgroundColor = "red";
    //Restore
    setTimeout(function() {
      document.getElementById("refreshServerInfoButton").textContent = "Refresh";
      document.getElementById("refreshServerInfoButton").style.backgroundColor = "blue";
      document.getElementById("refreshServerInfoButton").disabled = false;
    }, 2000);
    return;
  }
}

//call determinePage with the page parameter
determinePage(getParamByName("page"));
