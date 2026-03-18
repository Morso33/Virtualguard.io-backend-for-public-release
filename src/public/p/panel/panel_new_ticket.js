async function new_ticket(title, content, category)
{
    console.log("new ticket")
    const response = await fetch("/api/v1/ticket/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title,
            content: content,
            category: category
        })
    });
    const response_json = await response.json();
    return response_json;
}

const postForm= document.getElementById("formCreateTicket");
postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const category = document.getElementById("category").value;

    if (!title)
    {
        showError("You must enter a title for your ticket");
        return;
    }
    if (!category)
    {
        showError("You must enter a category for your ticket");
        return;
    }
    if (!content)
    {
        showError("You must enter content for your ticket");
        return;
    }
    else
    {
        hideError();
    }
    const response = await new_ticket(title, content, category);

    if (response.status === "error")
    {
        showError(response.error);
    }
    else
    {
        window.location.href = "/p/panel/ticket?id=" + response.id;
    }

});


async function showError(error)
{
    const errorDiv = document.getElementById("error");
    errorDiv.innerText = error;
    errorDiv.classList.remove("hidden");
}

async function hideError()
{
    const errorDiv = document.getElementById("error");
    errorDiv.classList.add("hidden");
}