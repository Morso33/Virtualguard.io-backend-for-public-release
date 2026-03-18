const engineState = {
  currentNotificationID: null,
  isShowingNotification: false,
  isQueue: false,
};

const notification_object = {
  id: null,
  title: null,
  description: null,
  showImage: true,
  customImageSource: null,
  customButtonExists: false,
  customButtonText: null,
  customButtonLink: null,
};

function getCookie(name) {
  const cookieValue = document.cookie.match(
    "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
  );
  return cookieValue ? cookieValue.pop() : "";
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}



function createModalNotification(notification) {

  //Verify the page is the homepage
  determineNotificationPage();

  engineState.isShowingNotification = true;

  //Get notification data
  const notificationId = notification.id;
  const notificationTitle = notification.title;
  const notificationDescription = notification.description;
  const showImage = notification.showImage;
  const customImageSource = notification.customImageSource;
  const customButtonExists = notification.customButtonExists;
  const customButtonText = notification.customButtonText;
  const customButtonLink = notification.customButtonLink;


  // Create modal overlay div
  const modalOverlay = document.createElement("div");
  modalOverlay.id =
    "tailwind-notification-engine-notification-" + notificationId;
  modalOverlay.classList.add(
    "fixed",
    "inset-0",
    "z-50",
    "flex",
    "items-center",
    "justify-center",
    "bg-black",
    "bg-opacity-80",
    "transition-opacity"
  );

  // Create modal container div
  const modalContainer = document.createElement("div");
  modalContainer.id =
    "tailwind-notification-engine-notification-" +
    notificationId +
    "-container";
  modalContainer.classList.add(
    "bg-white",
    "p-4",
    "rounded-lg",
    "shadow-lg",
    "flex",
    "flex-col",
    "items-center",
    "opacity-0",
    "transform",
    "scale-90",
    "transition-opacity",
    "duration:1000",
    "transition-transform",
    "duration-400",
    "mx-16"
  );

  // Create modal image
  const modalImage = document.createElement("img");
  if (customImageSource) {
    modalImage.src = customImageSource;
  } else {
    modalImage.src = "/assets/shield.png";
  }
  modalImage.alt = notificationTitle ? notificationTitle : "VirtualGuard.io";
  modalImage.classList.add("w-32", "h-32", "mb-4", "rounded-full");

  // Create modal title
  const modalTitle = document.createElement("h1");
  modalTitle.textContent = notificationTitle
    ? notificationTitle
    : "VirtualGuard.io";
  modalTitle.classList.add("text-4xl", "font-semibold", "text-center", "mb-4");

  // Create modal content
  const modalContent = document.createElement("p");
  modalContent.textContent = notificationDescription;
  modalContent.classList.add(
    "text-lg",
    "text-center",
    "mb-8",
    "md:whitespace-pre",
    "sm:whitespace:normal"
  );

  // Create a container div for the buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("flex", "justify-center", "space-x-4", "mt-4");

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.id = "close-modal";
  closeButton.textContent = "Close";
  closeButton.classList.add(
    "px-6",
    "py-3",
    "bg-blue-500",
    "text-white",
    "rounded",
    "hover:bg-blue-600",
    "focus:outline-none",
    "focus:ring",
    "focus:ring-blue-200"
  );
  //Setup Close button
  closeButton.addEventListener("click", function () {
    engineState.isShowingNotification = false;
    killModalNotification(notificationId);
  });
  //Custom button
  const customButton = document.createElement("button");
  customButton.id = "customButton-modal";
  customButton.textContent = customButtonText;
  customButton.addEventListener("click", function () {
    acknowledge_notification(engineState.currentNotificationID, customButtonLink);
  });
  customButton.classList.add(
    "px-6",
    "py-3",
    "text-white",
    "rounded",
    "bg-green-500",
    "hover:bg-green-600",
    "focus:outline-none",
    "focus:ring",
    "focus:ring-blue-200",
    "transition-colors"
  );

  // Append elements to the modal container
  if (showImage) {
    modalContainer.appendChild(modalImage);
  }
  modalContainer.appendChild(modalTitle);
  modalContainer.appendChild(modalContent);

  // Append buttons to the button container
  buttonContainer.appendChild(closeButton);
  if (customButtonExists) {
    buttonContainer.appendChild(customButton);
  }

  // Append button container to the modal container
  modalContainer.appendChild(buttonContainer);

  // Append modal container to modal overlay
  modalOverlay.appendChild(modalContainer);

  // Append modal overlay to the document body
  document.body.appendChild(modalOverlay);

  // Trigger a reflow to enable the transitions
  modalOverlay.offsetHeight;
  modalContainer.offsetHeight;

  // Apply fade-in effect by changing opacity and scale
  modalContainer.style.opacity = "1";
  modalContainer.style.transform = "scale(1)";
}

async function killModalNotification(notificationId) {
  const modalOverlay = document.getElementById(
    "tailwind-notification-engine-notification-" + notificationId
  );
  if (modalOverlay) {
    modalOverlay.classList.add("opacity-0");
    await acknowledge_notification(engineState.currentNotificationID);
    setTimeout(function () {
      loadModalNotifications();
      modalOverlay.remove();
      //Is a redirect requested?
      const urlParams = new URLSearchParams(window.location.search);
      const redirect_after_notification = urlParams.get("redirect_after_notification");
      if (redirect_after_notification)
      {
        console.log("Redirecting to: " + redirect_after_notification);
        window.location.href = redirect_after_notification;
      }
    }, 100);
  }
}

async function get_user_notifications() {
  try {
    const response = await fetch("/API/V1/notification/get_notifications");
    const data = await response.json();
    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
  }
}

async function acknowledge_notification(notification_id, redirectOnAcknowledge = null) {
  try {
    console.log("acknowledge_notification: " + notification_id);
    const response = await fetch(
      "/API/V1/notification/acknowledge_notification?notification_id=" +
        notification_id
    );
    const data = await response.json();
    console.log(data);
    if (redirectOnAcknowledge)
    {
      window.location.href = redirectOnAcknowledge;
    }
    return data;
  } catch (err) {
    console.log(err);
  }
}

function determineNotificationPage()
{
  //Are we currently on the homepage?
  if (window.location.pathname == "/" || window.location.pathname == "/index.html")
  {
    //Good, return.
    return;
  }
  else
  {
    //Bad, redirect to homepage.
    window.location.href = "/?redirect_after_notification= " + window.location.pathname + window.location.search;
  }

}

async function loadModalNotifications() {
  //Welcome notification
  if (!getCookie("_vg_has_seen_welcome")) {
    const notification = notification_object;

    notification.id = "first_time_welcome";
    notification.title = "VirtualGuard.io";
    notification.description =
      "Welcome to the VirtualGuard.io website.\r\nWe are currently not open for registrations.\r\nIf you'd like to beta-test our product please contact us on our Discord.\r\n\r\n-VirtualGuard Staff";
    notification.showImage = true;
    notification.customImageSource = null;
    notification.customButtonExists = true;
    notification.customButtonText = "Discord";
    notification.customButtonLink = "/link/discord";
    if (window.location.pathname == "/" || window.location.pathname == "/index.html")
    {
      createModalNotification(notification);
    }
    setCookie("_vg_has_seen_welcome", true, 1000);
  }
  //Get user notifications if logged in
  if (getCookie("_vg_logged_in")) {
    const notifications = await get_user_notifications();
    if (notifications.status == "error") {
      console.log("Failed to get notifications");
    }
    if (notifications.data.length > 0) {
        if (engineState.isShowingNotification == false)
        {
          const notification = notifications.data[0];
          const notification_json = JSON.parse(notification.notification_json);
          const notificationObject = notification_object;

          notificationObject.id = notification_json.id;
          notificationObject.title = notification_json.title;
          notificationObject.description = notification_json.description;
          notificationObject.showImage = notification_json.showImage;
          notificationObject.customImageSource = notification_json.customImageSource;
          notificationObject.customButtonExists = notification_json.customButtonExists;
          notificationObject.customButtonText = notification_json.customButtonText;
          notificationObject.customButtonLink = notification_json.customButtonLink;
          engineState.currentNotificationID = notification.id;
          createModalNotification(notificationObject);  
      }
      else
      {
        engineState.isQueue = true;
      }

    }
    if (notifications.data.length > 1)
    {
      engineState.isQueue = true;
    }
    else
    {
      console.log("No notifications");
    }
  }
}

loadModalNotifications();
