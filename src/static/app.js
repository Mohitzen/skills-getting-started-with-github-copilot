document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const template = document.getElementById("activity-template");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / previous cards
      activitiesList.innerHTML = "";

      // Reset select options (keep placeholder)
      activitySelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

      // Populate activities list using template
      Object.entries(activities).forEach(([name, details]) => {
        const node = template.content.cloneNode(true);
        const card = node.querySelector(".activity-card");

        node.querySelector(".activity-title").textContent = name;
        node.querySelector(".activity-desc").textContent = details.description;
        node.querySelector(".activity-schedule").innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        node.querySelector(".activity-capacity").innerHTML = `<strong>Capacity:</strong> ${details.max_participants}`;

        // Availability
        const spotsLeft = details.max_participants - details.participants.length;
        const availabilityEl = document.createElement("p");
        availabilityEl.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        card.appendChild(availabilityEl);

        // Participants list
        const list = node.querySelector(".participants-list");
        if (details.participants && details.participants.length) {
          details.participants.forEach(email => {
            const li = document.createElement("li");
            li.innerHTML = `<small>${email}</small>`;
            list.appendChild(li);
          });
        } else {
          list.classList.add("empty");
        }

        activitiesList.appendChild(node);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show the newly added participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
