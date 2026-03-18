//Hacky code. Do not recommend reading.


let editedMembers = {
    
}

function get_option_text(index)
{
    switch (index)
    {
        case 0:
        return "EXCLUDED";
        case 1:
        return "MUTATION";
        case 2:
        return "VIRTUALIZATION";
    }
}

function getToolTip(option)
{
    switch (option)
    {
        case "Project Name":
        return "The name of the project. This will be displayed in the Dashboard.";
        
        case "Enable Cloud Protection":
        return "This will enable our serverside protection.<br>This will make your file more secure, <br>but will require an internet connection to run.";
        
        case "Input File Name":
        return "The name of the file you uploaded. This cannot be changed.";
        
        case "Output File Name":
        return "The name of the output file.<br>This is the name of the file you download.";
        
        case "Import Protection":
        return "This will protect your imports from being dumped.<br>Delegate: Imports are resolved at runtime.<br>Virtualize: Imports are resolved at runtime and are encrypted.";
        
        case "String Hiding":
        return "This will hide your strings from being dumped.<br>Basic: Strings are encrypted.<br>Advanced: Strings are encrypted and randomized.";
        
        case "Anti Debug":
        return "This will prevent your file from being debugged.<br>Basic: Checks for a debugger.<br>Advanced: Checks for a debugger and terminates the process.";
        
        case "Virtual Junk":
        return "This will add junk code to your file.<br>Minimal: Adds a small amount of junk code.<br>Basic: Adds a moderate amount of junk code.<br>Advanced: Adds a large amount of junk code.";
        
        case "VM Sections":
        return "The name of the VM sections. This is used for the VM sections protection.";
        
        case "Watermark":
        return "The watermark that will be displayed when the VM sections are decrypted.";
        
        case "Rename Debug Symbols":
        return "This will rename the debug symbols in your file.<br>This will make it harder to debug your file.";
        
        case "Renaming Mode":
        return "This will change the way the debug symbols are renamed.<br>Minimal: Only the debug symbols are renamed.<br>Real: The debug symbols are renamed to real names.<br>Hidden: The debug symbols are renamed to random names.<br>Alphanumeric: The debug symbols are renamed to random alphanumeric names.";
        
        case "Cloud Integrity Check":
        return "The integrity of your file will be verified by our servers upon execution."
        
        case "Cloud Auto Update":
        return "The latest version of your file will be downloaded from our servers upon execution.<br>Please note that this may trigger a false positive with some anti viruses.";
        
        
        
        
        
        
        
        default:
        console.log("No tooltip found for: " + option);
        return "No tooltip found";
    }
}

function getParameter(name)
{
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getUnixTimestamp()
{
    return Math.floor(Date.now() / 1000);
}

function changeCloudOptionsVisibility(visibility)
{
    document.getElementById("allCloudOptions").style.transition = "max-height 1s ease-in-out";
    document.getElementById("allCloudOptions").style.opacity = "1";
    document.getElementById("cloudOptionsTextFade").style.transition = "opacity 1s ease-in-out";
    document.getElementById("cloudOptionsTextFade").style.opacity = visibility ? "1" : "0";
    //Get the height of the cloud options
    const cloudOptionsHeight = document.getElementById("allCloudOptions").scrollHeight
    document.getElementById("allCloudOptions").style.maxHeight = visibility ? cloudOptionsHeight + 32 + "px" : "0px"; //32: margin
    
    setTimeout(() => {
        document.getElementById("allCloudOptions").style.pointerEvents = visibility ? "auto" : "none";
        document.getElementById("allCloudOptions").style.opacity = visibility ? "1" : "0";
    }, 1000);
}



async function updateFileInfo(fileInfo)
{
    try
    {
        //Update inputFileName
        document.getElementById("inputFileName").value =  fileInfo.data.project_name;
        const fileExtension = fileInfo.data.project_name.split(".").pop();
        const fileName = fileInfo.data.project_name.split(".").slice(0, -1).join(".");
        document.getElementById("outputFileName").value = fileName +"-guarded." + fileExtension;
        
        //Parse the config
        const config = JSON.parse(fileInfo.data.config);
        console.log(config)
        
        //Update the select boxes. The config value is the index of the option to select
        document.getElementById("importProtection").selectedIndex = config.ImportProtection;
        document.getElementById("stringHiding").selectedIndex = config.StringHiding;
        document.getElementById("antiDebug").selectedIndex = config.AntiDebug;
        document.getElementById("virtualJunk").selectedIndex = config.VirtualJunk;
        document.getElementById("renamesymbols").selectedIndex = config.RenameDebugSymbols;
        document.getElementById("renamingmode").selectedIndex = config.RenamingMode;
        
        //Update vm sections
        document.getElementById("vmSections").value = config.VMSectionsName;
        //Update watermark
        document.getElementById("watermark").value = config.Watermark;
        
        //Update members
        const members = config.Members;
        
        //Create the members
        for (let i = 0; i < members.length; i++)
        {
            //Size 0 for now, mito can add later.
            createNewMember(members[i].DisplayName, 0, members[i].Option, members[i].MemberID);
        }
        //Set up event listeners for the edit buttons
        for (let i = 0; i < members.length; i++)
        {
            document.getElementById("editMemberButton-" + members[i].MemberID).addEventListener("click", () => {
                let optionText = get_option_text(members[i].Option);  
                editMember(members[i].MemberID, true, optionText);
            });
        }
        //set up event listener for the delete buttons
        for (let i = 0; i < members.length; i++)
        {
            document.getElementById("deleteMemberButton-" + members[i].MemberID).addEventListener("click", () => {
                //Set the option to excluded
                addEditedMemberToConfig(members[i].MemberID, 0);
                editMember(members[i].MemberID, false, "EXCLUDED");
            });
        }
        
        document.getElementById("memberAmount").textContent = "total members: " + members.length;
        
    }
    catch (err)
    {
        showToast("Failed to update file info: " + err, "error");
    }
}

async function getConfig(id)
{
    try
    {
        const response = await fetch("/api/v1/engine/get_file?id=" + id);
        const data = await response.json();
        return JSON.parse(data.data.config);
    }
    catch (err)
    {
        showToast("Failed to get config: " + err, "error");
    }
}

async function getFileInfo(id)
{
    const response = await fetch("/api/v1/engine/get_file?id=" + id);
    const data = await response.json();
    
    if (data.status === "error")
    {
        if (data.error_r === "get_file_file_not_found")
        {
            console.log("redirecting")
            window.location.href = "/error/403?reason=The file you requested does not exist, or your account does not have access to it. If you believe this is an error, please contact support.";
        }
        else if (data.request_reauth === true)
        {
            window.location.href = "/p/login?message=Please log in to continue&goto=" + window.location.href;
        }
        else
        {
            showToast("Failed to get file info: " + data.error, "error");
        }
    }
    //No error, start off by updating the file info
    await updateFileInfo(data);
    
    console.log (data);
}

async function run()
{
    try
    {
        const id = getParameter("id");
        updateSaveButton();
        setupModal()
        await getFileInfo(id);
        await manage_license();
        
        //if query string autoBuild is true, build the file
        if (getParameter("autoBuild") === "true")
        {
            showToast("Auto building file...", "info")
            document.getElementById("protectButton").click();
            //Remove the autoBuild query string, keep all others
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/&?autoBuild=true/, ''));
        }
    }
    catch (err)
    {
        showToast("Operation failed: " + err, "error");
    }
}

//Setup protect button 
document.getElementById("protectButton").addEventListener("click", async () => {
    //if update is needed
    if (document.getElementById("saveConfigButton").disabled === false)
    {
        showToast("Please either save your config or refresh the page before compiling.", "info");
        return;
    }
    openModal()
    
    const id = getParameter("id");
    //POST
    const startTime = getUnixTimestamp();
    const response = await fetch("/api/v1/engine/build?id=" + id, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id }), 
    });
    const data = await response.json();
    console.log(data)
    if (data.status === "error")
    {
        document.getElementById("loadingImg").style.animation = "floatDown 4s ease-in-out forwards";
        //timeout to allow the animation to finish
        setTimeout(() => {
            //change to success image
            document.getElementById("loadingImg").src = "/p/panel/assets/img/error.png";
            document.getElementById("loadingImg").style.marginLeft = "auto";
            document.getElementById("loadingImg").style.marginRight = "auto";
            document.getElementById("loadingImg").style.width ="40%";
            document.getElementById("loadingImg").style.marginTop = "31.5%"
            document.getElementById("loadingImg").style.marginBottom = "31.5%"
        }, 2000);
        setTimeout(() => {
            playSoundEffect("error_generic")
        }, 2200);
        setTimeout(() => {
            updateModal("Failed to compile file", "An error occurred", data.error+ "\nError code: " + data.error_r + "\nIf this persists please contact our Support.");
        }, 4000);
    }
    else
    {
        document.getElementById("loadingImg").style.animation = "floatDown 4s ease-in-out forwards";
        //timeout to allow the animation to finish
        setTimeout(() => {
            //change to success image
            document.getElementById("loadingImg").src = "/p/panel/assets/img/success.png";
            document.getElementById("loadingImg").style.marginLeft = "auto";
            document.getElementById("loadingImg").style.marginRight = "auto";
            document.getElementById("loadingImg").style.width ="40%";
            document.getElementById("loadingImg").style.marginTop = "31.5%"
            document.getElementById("loadingImg").style.marginBottom = "31.5%"
        }, 2000);
        setTimeout(() => {
            playSoundEffect("success_generic")
        }, 2200);
        setTimeout(() => {
            updateModal("The file compiled successfully!", "The file may be downloaded here: <a style='color:lightblue; text-decoration:underline;', ' href='/api/v1/engine/serve_file?id=" + id + "'>Download</a>", cleanUpInput(data.process_output), true);
        }, 4000);
    }
});

function cleanUpInput(input) {
    // Remove color characters using regex
    const colorRegex = /\u001b\[[0-9;]*m/g;
    const cleanedInput = input.replace(colorRegex, '');
    
    // Remove any other garbage using regex
    const garbageRegex = /\[[A-Z-]+\-\d+\.\d+\.\d+\]|\.\.\.|\!/;
    return cleanedInput.replace(garbageRegex, '');
}

//setup save button
document.getElementById("saveConfigButton").addEventListener("click", async () => {
    let config = await getConfig(getParameter("id"));
    config.ImportProtection = document.getElementById("importProtection").selectedIndex;
    config.StringHiding = document.getElementById("stringHiding").selectedIndex;
    config.AntiDebug = document.getElementById("antiDebug").selectedIndex;
    config.VirtualJunk = document.getElementById("virtualJunk").selectedIndex;
    config.OutputFileName = document.getElementById("outputFileName").value;
    config.VMSectionsName = document.getElementById("vmSections").value;
    config.Watermark = document.getElementById("watermark").value;
    config.OutputFileName = document.getElementById("outputFileName").value;
    config.InputFileName = document.getElementById("inputFileName").value;
    config.RenameDebugSymbols = document.getElementById("renamesymbols").selectedIndex ? true : false;
    config.RenamingMode = document.getElementById("renamingmode").selectedIndex;
    
    //Upate the members
    const members = config.Members;
    for (let i = 0; i < members.length; i++)
    {
        if (editedMembers[members[i].MemberID] !== undefined)
        {
            members[i].Option = editedMembers[members[i].MemberID];
        }
    }
    config.Members = members;
    
    if (config.OutputFileName.split(".").pop() !== "exe" && config.OutputFileName.split(".").pop() !== "dll")
    {
        showToast("Invalid output file name. Must end with .exe or .dll", "error");
        return;
    }
    
    config = JSON.stringify(config);
    
    //If the config is the same as the one on the server, do not update
    if (config === JSON.stringify(await getConfig(getParameter("id"))))
    {
        showToast("Nothing to update.", "warning");
        updateSaveButton(false);
        return;
    }
    showToast("Saving config...", "info");
    
    const response = await fetch("/api/v1/engine/update_config?id=" + getParameter("id"), {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: config, id: getParameter("id")}),
    });
    const data = await response.json();
    if (data.status === "error")
    {
        showToast("Failed to save config: " + data.error, "error");
    }
    else
    {
        showToast("Config saved successfully", "success");
        updateSaveButton(false);
    }
    
    console.log(config)
});

//add an event listener to every input element
const inputs = document.getElementsByTagName("input");
const selects = document.getElementsByTagName("select");
for (let i = 0; i < inputs.length; i++)
{
    inputs[i].addEventListener("input", () => {
        updateSaveButton(true);
    });
}
for (let i = 0; i < selects.length; i++)
{
    selects[i].addEventListener("change", () => {
        updateSaveButton(true);
    });
}


function updateSaveButton(configChanged)
{
    console.log("update save button: " + configChanged)
    if (configChanged)
    {
        document.getElementById("saveConfigButton").disabled = false;
        document.getElementById("saveConfigButton").style.backgroundColor = "#068a23";
        document.getElementById("saveConfigButton").textContent = "Save config";
    }
    else
    {
        document.getElementById("saveConfigButton").disabled = true;
        document.getElementById("saveConfigButton").style.backgroundColor = "#797c80";
        document.getElementById("saveConfigButton").style.transition = "background-color 0.5s";
        //text content change is animated
        document.getElementById("saveConfigButton").textContent = "Config saved";
    }
}

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

function createNewMember(name, size, protectionType, memberID) {
    
    protectionType = get_option_text(protectionType);
    const html = `
    <tr class="text-gray-700 dark:text-gray-400">
    <td class="px-4 py-3"style="padding:1rem;">
    <div class="flex items-center text-sm">
    <div>
    <p class="font-semibold">${name}</p>
    <p class="text-xs text-gray-600 dark:text-gray-400">
    MemberID: ${memberID}
    </p>
    </div>
    </div>
    </td>
    <td class="px-4 py-3 text-sm">
    ${size}
    </td>
    <td id="memberModification-${memberID}" class="px-4 py-3 text-xs">
    ${protectionType}
    </td>
    <td class="px-4 py-3">
    <div class="flex items-center space-x-4 text-sm">
    <button id="editMemberButton-${memberID}" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Edit">
    <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
    </svg>
    </button>
    <button id="deleteMemberButton-${memberID}" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Delete">
    <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
    </svg>
    </button>
    </div>
    </td>
    </tr>
    `;
    const memberHome = document.getElementById("memberHome");
    memberHome.innerHTML += html;
}
function addEditedMemberToConfig(memberID, option)
{
    updateSaveButton(true)
    //Push to the edited members array
    editedMembers[memberID] = option;
}


function editMember(memberID, showSelect, selectedOption)
{
    const memberModification = document.getElementById("memberModification-" + memberID);
    
    
    if (showSelect)
    {
        //Get the current value without whitespaces or newlines
        const currentValue = memberModification.textContent.replace(/\s/g, '');
        
        //If it is already a select box, do not create a new one
        if (memberModification.innerHTML.includes("select"))
        {
            if (editedMembers[memberID] === undefined)
            {
                memberModification.innerHTML = selectedOption;
            }
            else
            {
                memberModification.innerHTML = get_option_text(editedMembers[memberID])
            }
            return;
        }
        
        const html = `<select id="memberEditCallback-${memberID}" class="block w-full mt-1 text-sm dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 form-select focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:focus:shadow-outline-gray mr-0">
        <option value="EXCLUDED">EXCLUDED</option>
        <option value="MUTATION">MUTATION</option>
        <option value="VIRTUALIZATION">VIRTUALIZATION</option>
        </select>
        `;
        memberModification.innerHTML = html;
        
        //Set the value of the select box to the current value
        document.getElementById("memberEditCallback-" + memberID).value = currentValue;
        
        //Set up event listener for the select box
        document.getElementById("memberEditCallback-" + memberID).addEventListener("change", () => {
            addEditedMemberToConfig(memberID, document.getElementById("memberEditCallback-" + memberID).selectedIndex);
            editMember(memberID, false, get_option_text(document.getElementById("memberEditCallback-" + memberID).selectedIndex));
        });
        
    }
    else
    {
        memberModification.innerHTML = selectedOption;
    }
}

//Search event listener
document.getElementById("searchForMembers").addEventListener("input", () => {
    const searchForMembers = document.getElementById("searchForMembers").value;
    const members = document.getElementById("memberHome").children;
    for (let i = 0; i < members.length; i++)
    {
        const memberName = members[i].children[0].children[0].children[0].children[0].textContent;
        if (memberName.toLowerCase().includes(searchForMembers.toLowerCase()))
        {
            members[i].style.display = "table-row";
            document.getElementById("searchForMembers").style.borderColor = "transparent";
        }
        else
        {
            document.getElementById("searchForMembers").style.borderColor = "#e53e3e";
            members[i].style.display = "none";
        }
    }
    const visibleMembers = Array.from(members).filter(member => member.style.display !== "none");
    const searchAmount = visibleMembers.length;
    document.getElementById("memberAmount").textContent = "Total members: " + members.length + " (Showing: " + searchAmount + ")";
});

function setupModal()
{
    // Get the modal element
    const modal = document.getElementById('fileProcessModal');
    // Get the backdrop element
    const backdrop = document.querySelector('.backdrop');
    
    // Get the <span> element that closes the modal
    const closeModalButton = document.querySelector('.close');
    
    // When the user clicks on <span> (x) or outside the modal, close the modal
    function closeModal() {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Enable scroll on the body
        document.body.classList.remove('modal-open'); // Remove the class to disable the overlay
    }
    
    closeModalButton.addEventListener('click', closeModal);
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

function playSoundEffect(effectName)
{
    const audio = new Audio("/p/panel/assets/sound/" + effectName + ".mp3");
    switch (effectName)
    {
        case "error_generic":
        audio.volume = 0.05;
        break;
        case "success_generic":
        audio.volume = 0.2;
        break;
    }
    audio.play();
}

function openModal()
{
    resetModalToGeneric();
    const modal = document.getElementById('fileProcessModal');
    const backdrop = document.querySelector('.backdrop');
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Disable scroll on the body   
    modal.classList.add('modal-fade-in'); // Add the fade-in class to trigger the animation
}

function resetModalToGeneric()
{
    const modal = document.getElementById('fileProcessModal');
    const modalTitle = document.getElementById('modalTitle');
    const loadingImg = document.getElementById('loadingImg');
    const modalTextbox = document.getElementById('modalTextbox');
    const modalDescription = document.getElementById('modalDescription');
    
    modalTextbox.style.display = "none";
    modalDescription.style.display = "none";
    
    modalTitle.textContent = "Compiling file... Please wait...";
    loadingImg.style.display = "block";
    loadingImg.src = "/assets/loading.gif";
    loadingImg.style.animation = "";
    loadingImg.style.marginLeft = "";
    loadingImg.style.marginRight = "";
    loadingImg.style.width = "";
    loadingImg.style.marginTop = "";
    loadingImg.style.marginBottom = "";
    loadingImg.style.animation = "";
    
}

function updateModal (title, description, textbox, slowText = false)
{
    //disable the loading img
    const loadingImg = document.getElementById('loadingImg');
    loadingImg.style.display = "none";
    
    //update the title
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = title;
    
    //update the description
    const modalDescription = document.getElementById('modalDescription');
    modalDescription.innerHTML = description;
    modalDescription.style.display = "block";
    
    //update the textbox, the textbox will be updated 5 characters per second.
    const modalTextbox = document.getElementById('modalTextbox');
    modalTextbox.style.display = "block";
    modalTextbox.value = "";
    modalTextbox.readOnly = true;
    if (slowText)
    {
        let i = 0;
        const interval = setInterval(() => {
            modalTextbox.value += textbox[i];
            //If there is a newline, remove it
            if (textbox[i] === "\n")
            {
                modalTextbox.value = modalTextbox.value.slice(0, -1);
            }
            //If the text has gone out of the textbox, scroll to the bottom
            if (modalTextbox.scrollHeight > modalTextbox.clientHeight)
            {
                modalTextbox.scrollTop = modalTextbox.scrollHeight - modalTextbox.clientHeight;
            }
            i++;
            if (i >= textbox.length)
            {
                clearInterval(interval);
            }
        }, 5);
    }
    else
    {
        modalTextbox.value = textbox;
        
    }
}


//Get all elements with the id selectableOptionHoverAnchor and add an event listener to them. not classname, but id
const selectableOptionHoverAnchors = document.querySelectorAll("#selectableOptionHoverAnchor");
for (let i = 0; i < selectableOptionHoverAnchors.length; i++)
{
    selectableOptionHoverAnchors[i].addEventListener("mouseover", () => {
        const text = selectableOptionHoverAnchors[i].textContent;
        const showableToolTip = getToolTip(text.trim());
        //Does the tooltip already exist?
        if (selectableOptionHoverAnchors[i].children.length > 0)
        {
            selectableOptionHoverAnchors[i].children[0].style.opacity = "1";
            return;
        }
        console.log("creating tooltip")
        const toolTipText = document.createElement("span");
        toolTipText.classList.add("tooltiptext");
        toolTipText.innerHTML = showableToolTip;
        //Center it to the anchor
        toolTipText.style.left = "50%";
        toolTipText.style.transform = "translateX(-50%)";
        
        //Use the fadeIn animation
        toolTipText.style.animation = "fadeIn 0.2s ease-in-out forwards";
        
        selectableOptionHoverAnchors[i].appendChild(toolTipText);
        //Set the parent to relative
        selectableOptionHoverAnchors[i].style.position = "relative";
        
        
        
    });
    selectableOptionHoverAnchors[i].addEventListener("mouseout", () => {
        //Set visibility to hidden
        //Remove the old animation
        selectableOptionHoverAnchors[i].children[0].style.animation = "";
        selectableOptionHoverAnchors[i].children[0].style.opacity = "0";
        
    });
}

//Add an event listener to the cloud protection select
document.getElementById("enableCloudProtection").addEventListener("change", () => {
    changeCloudOptionsVisibility(document.getElementById("enableCloudProtection").selectedIndex === 0);
});


async function manage_license()
{
    const get_user_license = await fetch("/api/v1/user/get_license");
    const user_license = await get_user_license.json();
    console.log(user_license)
    switch (user_license.data)
    {
        case 0: //FREE LICENSE
        lockOption("enableCloudProtection", 2);

        lockOption("antiDebug", 1);
        lockOption("virtualJunk", 1);
        lockOption("renamesymbols", 1);
        lockOption("renamingmode", 1);
        lockOption("vmSections", 1);
        lockOption("watermark", 1);

        break;
        case 1: //VGLITE LICENSE
        lockOption("enableCloudProtection", 2);
        break;
        case 2: //VG+ LICENSE
        //Lock nothing
        break;
    
    }
}

function lockOption(htmlId, requiredLevel)
{
    document.getElementById(htmlId).disabled = true;
    let requiredLicense = "";
    switch
    (requiredLevel)
    {
        case 0:
        requiredLicense = "Free";
        break;
        case 1:
        requiredLicense = "VirtualGuard Lite or VirtualGuard+";
        break;
        case 2:
        requiredLicense = "VirtualGuard+";
        break;
        default:
        requiredLicense = "UNKOWN";
    }
    document.getElementById(htmlId).style.color = "#d5d6d7"
    //opacity
    document.getElementById(htmlId).style.opacity = "0.6";

    //if it is a select
    if (document.getElementById(htmlId).tagName === "SELECT")
    {
        document.getElementById(htmlId).innerHTML = `<option value="0">${requiredLicense} required</option>`;
        return;
    }
    //if it is an input
    document.getElementById(htmlId).value = requiredLicense + " required";
}



run();