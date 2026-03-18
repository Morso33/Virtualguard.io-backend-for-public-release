function createNewFile(filename, fileSize, uploadTime, isProtected, lastBuildTime, fileHref, lastBuildTimeUnix, id) {
  // Create the table row element
  var row = document.createElement('tr');
  row.className = 'text-gray-700 dark:text-gray-400';
  
  // Create the first table cell containing the filename and file size
  var cell1 = document.createElement('td');
  cell1.className = 'px-4 py-3';
  
  var flexContainer = document.createElement('div');
  flexContainer.className = 'flex items-center text-semibold';
  cell1.appendChild(flexContainer);
  
  var filenameElement = document.createElement('a');
  //underline
  filenameElement.className = 'font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 hover:underline';
  filenameElement.textContent = filename;
  //href
  filenameElement.href = fileHref;
  flexContainer.appendChild(filenameElement);
  
  var fileSizeElement = document.createElement('p');
  fileSizeElement.className = 'text-xs text-gray-600 dark:text-gray-400';
  fileSizeElement.textContent = fileSize;
  cell1.appendChild(fileSizeElement);
  
  row.appendChild(cell1);
  
  // Create the second table cell containing the execution time
  var cell2 = document.createElement('td');
  cell2.className = 'px-4 py-3 text-sm';
  cell2.textContent = uploadTime;
  row.appendChild(cell2);
  
  // Create the third table cell containing the protection status
  var cell3 = document.createElement('td');
  cell3.className = 'px-4 py-3 text-xs';
  
  var spanElement = document.createElement('span');
  if (isProtected === "Protected")
  {
    spanElement.className = 'px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-full dark:bg-green-700 dark:text-green-100';
  }
  else
  {
    spanElement.className = 'px-2 py-1 font-semibold leading-tight text-red-700 bg-red-100 rounded-full dark:bg-red-700 dark:text-red-100';
  }
  spanElement.textContent = isProtected;
  cell3.appendChild(spanElement);
  
  row.appendChild(cell3);
  
  // Create the fourth table cell containing the date
  var cell4 = document.createElement('td');
  cell4.className = 'px-4 py-3 text-sm';
  cell4.textContent = lastBuildTimeUnix ? lastBuildTime : "Never";
  row.appendChild(cell4);
    //Create the update executable button
    var cell6 = document.createElement('td');
    cell6.className = 'px-4 py-3 text-sm';
    var updateButton = document.createElement('a');
    //use plain colors
    updateButton.className = 'px-2 py-1 font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-100';
    updateButton.onmouseover = function() {this.style.background = "lightgreen"};
    updateButton.onmouseout = function() {this.style.background = ""};
    updateButton.style.transition = "background 0.2s ease";
    updateButton.textContent = "#PRESS_TO_UPLOAD";
    updateButton.href = "upload?projectUpdate=true&projectUpdateId=" + id;
    cell6.appendChild(updateButton);
    row.appendChild(cell6);
  //Create the fifth table cell containing the download button
  var cell5 = document.createElement('td');
  cell5.className = 'px-4 py-3 text-sm';
  if (lastBuildTimeUnix != 0)
  {
    var downloadButton = document.createElement('a');
    //use plain colors
    downloadButton.className = 'px-2 py-1 font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-100';
    downloadButton.style.color = "green"
    downloadButton.textContent = "Download";
    downloadButton.href = "/api/v1/engine/serve_file?id=" + id;
    cell5.appendChild(downloadButton);
  }
  else
  {
    var downloadButton = document.createElement('a');
    //use plain colors
    downloadButton.className = 'px-2 py-1 font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-100';
    downloadButton.textContent = "Compile";
    downloadButton.href = "engine/file?id=" + id + "&autoBuild=true";
    cell5.appendChild(downloadButton);
  }
  row.appendChild(cell5);
  //Create the delete button
  var cell6 = document.createElement('td');
  cell6.className = 'px-4 py-3 text-sm';
  var deleteButton = document.createElement('a');
  //turn red when hovered
  deleteButton.onmouseover = function() {this.style.background = "darkred"};
  deleteButton.onmouseout = function() {this.style.background = ""};
  deleteButton.style.transition = "background 0.2s ease";
  deleteButton.className = 'px-2 py-1 font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-100'
  deleteButton.style.cursor = "pointer";
  deleteButton.textContent = "🗑️";
  deleteButton.onclick = function() {delete_project(id, deleteButton)};
  cell6.appendChild(deleteButton);
  row.appendChild(cell6);
  // Return the created table row
  return row;
}

async function delete_project(id, delete_button_object)
{
  try
  {
    //clear the text
    delete_button_object.textContent = "";
    //Create a button inside
    var loading_button = document.createElement('button');
    loading_button.className = ''
    loading_button.disabled = true;
    loading_button.textContent = "⚙️";
    delete_button_object.appendChild(loading_button);
    loading_button.classList.add("pulse-animation")
    //After 200 ms,
    setTimeout(function() {
      //Remove pulse
      loading_button.classList.remove("pulse-animation");
      loading_button.classList.add("spin-animation");
    }, 100);
    //Send the request
    const response = await fetch('/api/v1/engine/delete?id=' + id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    const data = await response.json();
    //If it was successful,
    if (data.status === "success")
    {
      //Delete loading button
      delete_button_object.removeChild(loading_button);
      delete_button_object.textContent = "✅";
      //animation
      delete_button_object.parentElement.parentElement.style.transition = "opacity 0.5s ease";
      delete_button_object.parentElement.parentElement.style.opacity = "0";
      setTimeout(function() {
        delete_button_object.parentElement.parentElement.remove();
      }, 500);
      
      
    }
    else
    {
      showToast("Failed to delete project: " + data.error, "error");
      delete_button_object.removeChild(loading_button);
      delete_button_object.textContent = "❌";
      setTimeout(function() {
        delete_button_object.textContent = "🗑️";
      }, 5000);
    }
  }
  catch (err)
  {
    showToast("Failed to delete project: " + err, "error");
  }
}


async function fetch_projects_by_user()
{
  const response = await fetch('/api/v1/user/get_user_projects', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const data = await response.json();
  return data.data;
}

async function fetch_projects_misc_data()
{
  const response = await fetch('/api/v1/user/get_user_projects', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const data = await response.json();
  return data;
}




async function update_dashboard_info(files_protected, license_type, license_expiry)
{
  console.log(files_protected);
  const files_protected_element = document.getElementById('filesProtected');
  const license_type_element = document.getElementById('licenseType');
  const license_expiry_element = document.getElementById('licenseExpiry');
  
  files_protected_element.textContent = files_protected;
  license_type_element.textContent = license_type;
  license_expiry_element.textContent = license_expiry
}



function unix_timestamp_to_date(timestamp, includeTime)
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

function get_license_type(index)
{
  switch (index)
  {
    case 0:
    return "No license";
    case 1:
    return "VirtualGuard";
    case 2:
    return "VirtualGuard+";
    default:
    return "Unknown";
  }
}

function get_file_size_type(bytes)
{
  if (bytes >= 1000000000)
  {
    return (bytes / 1000000000).toFixed(1) + " GB";
  }
  else if (bytes >= 1000000)
  {
    return (bytes / 1000000).toFixed(1) + " MB";
  }
  else if (bytes >= 1000)
  {
    return (bytes / 1000).toFixed(1) + " KB";
  }
  else
  {
    return bytes + " B";
  }
}

async function loadProjects()
{
  const projects = await fetch_projects_by_user();
  const misc_data = await fetch_projects_misc_data();
  
  //totalProjectAmount
  document.getElementById('totalProjectAmount').textContent = "Showing " + projects.length + " projects";
  
  update_dashboard_info(misc_data.total_files_protected, get_license_type(misc_data.license_type), misc_data.license_expiry ? unix_timestamp_to_date(misc_data.license_expiry, false) : "Lifetime");
  const projectContainer = document.getElementById('projectContainer');
  if (projects == undefined)
  {
    return;
  }
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const row = createNewFile(project.project_name, get_file_size_type(project.file_size) , unix_timestamp_to_date(project.uploaded_at, false), (project.last_build_time == 0 ? "Unprotected" : "Protected"), unix_timestamp_to_date(project.last_build_time, false), "/p/panel/engine/file?id=" + project.id, project.last_build_time, project.id);
    projectContainer.appendChild(row);
  }
  
}


async function tryCreateNewProject()
{
  try
  {
    showToast("Creating new project...", "info");
  }
  catch (err)
  {
    showToast("Failed to create new project: " + err, "error");
  }
}

//Set listener to create new project button
const createNewProjectButton = document.getElementById('createNewProjectButton');
createNewProjectButton.addEventListener('click', tryCreateNewProject);




loadProjects();