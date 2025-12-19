document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const template = document.getElementById("activity-template");

  // Utility: derive initials from email local-part
  function getInitials(email) {
    if (!email) return "?";
    const local = email.split("@")[0];
    const parts = local.split(/[\.\-_]/).filter(Boolean);
    const first = (parts[0] || local).charAt(0);
    const second = parts[1] ? parts[1].charAt(0) : (local.charAt(1) || "");
    return (first + second).toUpperCase();
  }
 
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

        // Participants list (avatar + email + delete)
        const list = node.querySelector(".participants-list");
        if (details.participants && details.participants.length) {
          // ensure empty state not shown
          list.classList.remove("empty");
          details.participants.forEach(email => {
            const li = document.createElement("li");

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = getInitials(email);

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-btn";
            deleteBtn.title = `Remove ${email}`;
            deleteBtn.innerHTML = "✖";

            // Delete handler: call DELETE endpoint to unregister participant
            deleteBtn.addEventListener("click", async () => {
              if (!confirm(`Remove ${email} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await res.json();
                if (res.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "message success";
                  // refresh list
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Failed to remove participant";
                  messageDiv.className = "message error";
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "message error";
              }
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            });

            li.appendChild(avatar);
            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            li.title = email;
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
