
//listener for fileInput id
document.getElementById('dropzone-file').addEventListener('change', uploadFileWithProgress, false);

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function updateStatus(message, color)
{
    if (color)
    {
        document.getElementById('uploadStatus').style.color = color;
    }
    document.getElementById('uploadStatus').textContent = message;
}
function updateType(message, color)
{
    if (color)
    {
        document.getElementById('uploadType').style.color = color;
    }
    document.getElementById('uploadType').textContent = message;
}

function uploadFileWithProgress() {
    updateStatus("", "#9e9e9e")
    const file = document.getElementById('dropzone-file').files[0];
    document.getElementById('dropzone-file').disabled = true;
    if (!file)
    {
        updateStatus("No file selected", "red");
        updateType("Please upload another file")
        document.getElementById('dropzone-file').disabled = false;
        return
    }
    if (file.size > 100000000) //100MB
    {
        updateStatus("File is too large, " + Math.floor(file.size / 1000000) + "/100 MB. Please contact our support if you wish to upload larger files.", "red");
        updateType("Please upload another file")
        document.getElementById('dropzone-file').disabled = false;
        return;
    }
    if (file.size === 0)
    {
        updateStatus("File is empty", "red");
        updateType("Please upload another file")
        document.getElementById('dropzone-file').disabled = false;
        return;
    }
    if (!(file.name.endsWith(".exe") || file.name.endsWith(".dll")))
    {
        updateStatus("File is not an executable, (EXE/DLL)", "red");
        updateType("Please upload another file")
        document.getElementById('dropzone-file').disabled = false;
        return;
    }

    const progressBar = document.getElementById('progress-bar');
    const xhr = new XMLHttpRequest();

    updateType(file.name);
    const start_time = Math.floor(Date.now());
    
    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            if (percentComplete === 100)
            {
                updateStatus("Processing file...");
                progressBar.style.width = `0%`;
                return;
            }
            progressBar.style.width = `${percentComplete}%`;
            updateStatus(`Uploading file | ` +   Math.floor(percentComplete) + "% (" + Math.floor(event.loaded / 1000000) + "MB/" + Math.floor(event.total / 1000000) + "MB)");
        }
    });
    
    xhr.onreadystatechange = () => {
        //check json status
        if (xhr.readyState === XMLHttpRequest.DONE) {
            //Check that response is valid json
            if (isJson(xhr.responseText) === false)
            {
                updateStatus("Upload failed: "+ xhr.responseText, "red");
                document.getElementById('dropzone-file').disabled = false;
                return;
            }
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (response.status === "success")
            {
                const end_time = Math.floor(Date.now());
                updateStatus("Upload complete. Took " + Math.round( ((end_time - start_time) / 1000) * 10) /10 + " seconds. Redirecting...");
                updateType("Success")
                setTimeout(() => {
                    window.location.href = "/p/panel/engine/file?id=" + response.id;
                }
                , 1000);
            }
            else
            {
                updateStatus("Upload failed: " + response.error + "(" + response.error_r + ")", "red");
                document.getElementById('dropzone-file').disabled = false;
            }
        }
    };
    
    xhr.open("POST", "/API/V1/engine/upload");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("filesize", file.size);
    formData.append("filetype", file.type);
    xhr.send(formData);
}

function dragOverHandler(ev) {
    console.log("File(s) in drop zone");
    //coordinates
    dropZoneHoverAnimation(true)
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  }

function dragOutHandler(ev) {
    console.log("File(s) left drop zone");
    dropZoneHoverAnimation(false)
    const urlParams = new URLSearchParams(window.location.search);
    const isProjectUpdate = urlParams.get('projectUpdate');
    const projectUpdateId = urlParams.get('projectUpdateId');
    if (isProjectUpdate === "true")
    {
        updateStatus("Updating project: " + projectUpdateId);
    }
}

function dropZoneHoverAnimation(bShow)
{
    document.getElementById('dropAreaParentMain').style.background = bShow ? "#14181f" : "#1c2129";
    const dropzone = document.getElementById("dropAreaParent");
    //Edit the padding
    if (bShow)
    {
       updateStatus("Drop file to upload", "#9e9e9e");
       updateType("Drag & Drop")
        dropzone.style.animation="marginDecrease 0.5s forwards";
    }
    else
    {
        updateStatus("Click to upload or drag & drop", "#9e9e9e");
        updateType("EXE OR DLL")
        dropzone.style.animation="marginIncrease 0.5s forwards";
    }
}

function dropHandler(ev) {
    console.log("File(s) dropped");
    dropZoneHoverAnimation(false)
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    updateStatus("Processing dropped file...");
    updateType("")
  
    //Move the file to the input
    const file = ev.dataTransfer.files[0];
    document.getElementById('dropzone-file').files = ev.dataTransfer.files;
    

    //Upload the file
    uploadFileWithProgress();
}



function initUploadWindow()
{
    const urlParams = new URLSearchParams(window.location.search);
    const isProjectUpdate = urlParams.get('projectUpdate');
    const projectUpdateId = urlParams.get('projectUpdateId');

    if (isProjectUpdate === "true")
    {
    console.log("Updating project: " + projectUpdateId);
    //Update the title
updateStatus("Updating project: " + projectUpdateId);
document.getElementById("configHeader").textContent = "Update project";
    //Update the description

    }
}

initUploadWindow();