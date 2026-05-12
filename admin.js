let adminAccounts = [];
let alumniList = [];
//Store logged in role
let currentRole = null;
// ------------------
// Login System
// ------------------

//Create Submit event listner for form with ID login-form
document.getElementById("login-form").addEventListener("submit", function (e) {
	//Prevent default page reload
	e.preventDefault();
	//Get username and password from form
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

// Temporary login system
//	if (username === "admin" && password === "password") {
//    	    currentRole = "admin";
//        } else if (username === "super" && password === "password") {
//        	currentRole = "super";
//	} else {
  //      	alert("Invalid credentials");	
//		return;
//	}

//	document.getElementById("login-section").style.display = "none";
//	document.getElementById("dashboard").style.display = "block";
//	applyRolePermissions();

	//Create link to admin.php
	 fetch("admin.php", {
        	method: "POST",
		 //Tell PHP you are send JSON
       		 headers: {
           		 "Content-Type": "application/json"
       	        },
		//Convert JS object to JSON string
        	body: JSON.stringify({
			//Matches switch case action
            		action: "login",
            		username: username,
           		password: password
        	})
   	 })
	//Get PHP response and if success = true then set current role and apply permissions 	
   	.then(response => response.json())
    	.then(data => {
        if (data.success) {

           	//  Store role from PHP
           	currentRole = data.role;
           	document.getElementById("login-section").style.display = "none";
            	document.getElementById("dashboard").style.display = "block";
            	applyRolePermissions();

        } else {
            	alert(data.message);
        	}
   	})
   	.catch(error => {
        	console.error("Login error:", error);
       	alert("Something went wrong.");
	});
});

// Show/Hide buttons on admin Role

function applyRolePermissions() {
        const superOnly = document.querySelectorAll(".super-only");

        if (currentRole === "super") {
                superOnly.forEach((btn) => (btn.style.display = "block"));
        } else if (currentRole === "admin"){
                superOnly.forEach((btn) => (btn.style.display = "none"));
        }
}

// --- Panel System ---

//Hide all Panels Function
function hideAllPanels() {
        const panels = document.querySelectorAll("section");
        panels.forEach((p) => (p.style.display = "none"));

};

//Show Specific Section
function showPanel(panelId) {
	hideAllPanels();
	document.getElementById(panelId).style.display = "block";
}

// --- Button Listeners ---

//Dashboard --> Add Alumni Panel
document.getElementById("add-alumni-btn").addEventListener("click", () => {
	showPanel("add-alumni");
});

//Add Alumni --> Back to Dashboard
document.getElementById("add-alumni-back").addEventListener("click", () => {
	showPanel("dashboard");
	addAlumniForm.reset();
	
});

//---------------------------
// Edit Alumni Selector Panel
// --------------------------


//Dashboard --> Edit Selector
document.getElementById("edit-alumni-btn").addEventListener("click", () => {
	showPanel("edit-select");
	fetchAlumni();
});

//Edit Selector --> Dashboard
document.getElementById("edit-select-back").addEventListener("click", () => {
	showPanel("dashboard");
});


function fetchAlumni() { 

    fetch("admin.php", { 
        method: "POST", 
        headers: { 
            "Content-Type": "application/json" 
        }, 
        body: JSON.stringify({ action: "getAlumni" }) 
    }) 
    .then(res => res.json()) 
    .then(data => { 
        if (data.success) { 
            alumniList = data.alumni; 
            loadAlumniList(); // now render them 
        } else { 
            alert("Failed to load alumni" + err.message); 
        } 
    }) 
    .catch(err => { 
        console.error(err); 
        alert("Error loading alumni: " + err.message); 
    }); 
}

//Load List of Alumni 

function loadAlumniList(filterText = "") {
    const list = document.getElementById("alumni-list");
    list.innerHTML = "";

    const searchLower = filterText.toLowerCase();

    alumniList
        .filter(acc => {
            const fullName = `${acc.first_name} ${acc.last_name}`.toLowerCase();
            const job = (acc.job_title || "").toLowerCase();

            return fullName.includes(searchLower) || job.includes(searchLower);
        })
        .forEach((acc) => {
            const row = document.createElement("div");
            row.classList.add("edit-item");

            row.innerHTML = `
                <span class="item-name">
                    ${acc.first_name} ${acc.last_name} (${acc.job_title})
                </span>
                <div class="edit-delete-alumni-btns">
                    <button class="edit-alumni-btn" data-id="${acc.id}">Edit</button>
                    <button class="delete-alumni-btn" data-id="${acc.id}">Delete</button>
                </div>
            `;

            list.appendChild(row);
        });

    attachAlumniEditButtons();
    attachAlumniDeleteButtons();
}




//------------------------
// Search Bar Filter
//------------------------

const searchInput = document.getElementById("edit-search");

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        loadAlumniList(e.target.value);
    });
}

//-----------------------------------------
// Clicking an Alumni --> Go to Edit Panel
// ----------------------------------------

function attachAlumniEditButtons() {
	const buttons = document.querySelectorAll(".edit-alumni-btn");

	buttons.forEach((btn) => {
		btn.addEventListener("click", () => {
			const id = btn.getAttribute("data-id");
			loadAlumniIntoEditPanel(id);
			showPanel("edit-alumni");
		});
	});
}

const editProgramSelect = document.getElementById("edit-alumni-program");
const editConcentrationSelect = document.getElementById("edit-alumni-concentration");

editProgramSelect.addEventListener("change", function () {
    populateConcentrations(this.value, editConcentrationSelect);
});

function loadAlumniIntoEditPanel(id) {
	const alumni = alumniList.find((a) => a.id == id);
	
	if(!alumni) return;

	//Fill in updated fields
	
	document.getElementById("edit-pennwestID").value = alumni.id || "";
	document.getElementById("edit-firstname").value = alumni.first_name || "";
	document.getElementById("edit-lastname").value = alumni.last_name || "";
	document.getElementById("edit-jobtitle").value = alumni.job_title || "";
	document.getElementById("edit-employer").value = alumni.employer || "";
	document.getElementById("edit-jobsetting").value = alumni.job_setting || "";
	document.getElementById("edit-yearStart").value = alumni.year_start || "";
	document.getElementById("edit-yearGrad").value = alumni.year_grad || "";
	document.getElementById("edit-bio").value = alumni.bio || "";
	
	// ✅ Set program first
	const programSelect = document.getElementById("edit-alumni-program");
	const concentrationSelect = document.getElementById("edit-alumni-concentration");

	programSelect.value = alumni.program || "";

	// ✅ Then populate + auto-select concentration
	populateConcentrations(
	alumni.program,
	concentrationSelect,
	alumni.concentration
	);

	//Back Button
	document.getElementById("edit-alumni-back").onclick = () => {
		showPanel("edit-select");
	};
}

const editSaveBtn = document.getElementById("edit-save-btn");

if (editSaveBtn) {
    editSaveBtn.addEventListener("click", function () {

        const formData = new FormData();
        formData.append("action", "updateAlumni");

        formData.append("id", document.getElementById("edit-pennwestID").value);
        formData.append("first_name", document.getElementById("edit-firstname").value);
        formData.append("last_name", document.getElementById("edit-lastname").value);
        formData.append("job_title", document.getElementById("edit-jobtitle").value);
        formData.append("employer", document.getElementById("edit-employer").value);
        formData.append("job_setting", document.getElementById("edit-jobsetting").value);
        formData.append("year_start", document.getElementById("edit-yearStart").value);
        formData.append("year_grad", document.getElementById("edit-yearGrad").value);
        formData.append("program", document.getElementById("edit-alumni-program").value);
        formData.append("concentration", document.getElementById("edit-alumni-concentration").value);
        formData.append("bio", document.getElementById("edit-bio").value);

        // Image (optional)
        const imageInput = document.getElementById("edit-alumni-image");
        if (imageInput.files.length > 0) {
            formData.append("edit-alumni-image", imageInput.files[0]);
        }

        fetch("admin.php", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Alumni updated successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);


                // Optional: reload list
                fetchAlumni();

                // Go back to list
                showPanel("edit-select");

            } else {
                alert("Update failed: " + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error updating alumni");
        });
    });
}

function attachAlumniDeleteButtons() {
    document.querySelectorAll(".delete-alumni-btn").forEach(btn => {
        btn.onclick = function () {
            const id = this.getAttribute("data-id");

            if (!confirm("Are you sure you want to delete this alumni?")) {
                return;
            }

            fetch("admin.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "deleteAlumni",
                    id: id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Alumni deleted successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);

                    fetchAlumni(); // reload list
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Delete failed");
            });
        };
    });
}




// ------------------------
// MANAGE WEBSITE PANEL STUFF
// ------------------------

// -- EDIT WELCOME MESSAGE PANEL --

document.getElementById("welcome-save-btn").addEventListener("click", function () {

    const heading = document.getElementById("edit-welcome-message-heading").value;
    const message = document.getElementById("edit-welcome-message").value;

    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "updateIntro",
            Header: heading,
            OpMsg: message
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Welcome Message updated successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);

        } else {
            console.error(data);
            alert("Failed to update welcome message.");
        }
    })
    .catch(err => console.error("Error:", err));

});

// -- EDIT FEATURED VIDEO PANEL --

document.getElementById("video-save-btn").addEventListener("click", function () {

    let link = document.getElementById("edit-featured-video-link").value;

    // Convert watch?v= → embed
    if (link.includes("watch?v=")) {
        const videoId = link.split("watch?v=")[1].split("&")[0];
        link = "https://www.youtube.com/embed/" + videoId;
    }

    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "updateIntro",
            FeatVid: link
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Featured Video updated successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);

        } else {
            console.error(data);
            alert("Failed to update video.");
        }
    })
    .catch(err => console.error("Error:", err));

});

function loadWelcomeEditor() {

    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "getIntro" })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            console.error("Failed to load intro data");
            return;
        }

        const heading = data.data.Header || "";
        const message = data.data.OpMsg || "";

        document.getElementById("edit-welcome-message-heading").value = heading;
        document.getElementById("edit-welcome-message").value = message;
    })
    .catch(err => console.error("Error loading welcome editor:", err));
}

function loadVideoEditor() {

    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "getIntro" })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) return;

        const video = data.data.FeatVid || "";

        document.getElementById("edit-featured-video-link").value = video;
    })
    .catch(err => console.error("Error loading video editor:", err));
}


// -- AWARDS PANEL STUFF --


// Load Awards List
function loadAwardsList(filterText = "") {
    const container = document.getElementById("awards-list");
    container.innerHTML = "";

    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "getAwards"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            console.error("Failed to load awards");
            return;
        }

        const searchLower = filterText.toLowerCase();

        data.awards
            .filter(award => award.name.toLowerCase().includes(searchLower))
            .forEach(award => {
                const row = document.createElement("div");
                row.classList.add("edit-item");

                row.innerHTML = `
                    <span class="item-name">${award.name}</span>
                    <div class="edit-delete-item-btns">
                        <button class="edit-award-btn" data-id="${award.id}">Edit</button>
                        <button class="delete-award-btn" data-id="${award.id}">Delete</button>
                    </div>
                `;

                container.appendChild(row);
            });

        attachAwardButtons();
    })
    .catch(err => {
        console.error(err);
    });
}

// Attach Edit/Delete Buttons to Each Award Entry
function attachAwardButtons() {
    // Edit Button
    document.querySelectorAll(".edit-award-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            editAward(id);
        });
    });

    // Delete Button
    document.querySelectorAll(".delete-award-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");

            if (!confirm("Are you sure you want to delete this award?")) {
                return;
            }

            fetch("admin.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "deleteAward",
                    id: id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Award deleted successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);


                    // Reload list
                    loadAwardsList();
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Delete failed");
            });
        });
    });
}

function editAward(id) {
    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "getAwardById",
            id: id
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert("Failed to load award");
            return;
        }

        // Populate your edit fields
        document.getElementById("edit-award-id").value = data.award.id;
        document.getElementById("edit-award-name").value = data.award.name;

        // Show the edit panel (adjust to your UI system)
        showPanel("edit-award");
    })
    .catch(err => {
        console.error(err);
        alert("Error loading award");
    });

	 //Back Button
        document.getElementById("edit-award-back").onclick = () => {
                showPanel("manage-awards");
        };

}

const editAwardSaveBtn = document.getElementById("edit-award-save");

if (editAwardSaveBtn) {
    editAwardSaveBtn.addEventListener("click", function () {

        const id = document.getElementById("edit-award-id").value;
        const name = document.getElementById("edit-award-name").value;

        if (!name.trim()) {
            alert("Award name cannot be empty");
            return;
        }

        fetch("admin.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "updateAward",
                id: id,
                name: name
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Award updated successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);


                // Reload list
                loadAwardsList();

                // Go back to list panel
                showPanel("manage-awards");
            } else {
                alert("Update failed: " + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error updating award");
        });
    });
}

const addAwardBtn = document.getElementById("add-award-btn");

if (addAwardBtn) {
    addAwardBtn.addEventListener("click", function () {

        const nameInput = document.getElementById("new-award-name");
        const name = nameInput.value.trim();

        if (!name) {
            alert("Please enter an award name");
            return;
        }

        fetch("admin.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "addAward",
                name: name
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Award added successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);


                // Clear input
                nameInput.value = "";

                // Reload list
                loadAwardsList();
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Failed to add award");
        });
    });
}

// Awards Search Bar
document.getElementById("awards-search").addEventListener("input", (e) => {
	loadAwardsList(e.target.value);
});

// ---------------------
// -- FAQ Panel Stuff --
// ---------------------

let ADMIN_FAQS = [];
let editIndex = null;

const questionInput = document.getElementById("question");
const answerInput = document.getElementById("answer");
const cancelBtn = document.getElementById("cancelEdit");

function checkFormChanges() {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (editIndex === null) {
    // Adding new FAQ
    cancelBtn.style.display = (question || answer) ? "inline-block" : "none";
  } else {
    // Editing existing
    const original = ADMIN_FAQS[editIndex];

    if (question !== original.q || answer !== original.a) {
      cancelBtn.style.display = "inline-block";
    } else {
      cancelBtn.style.display = "none";
    }
  }
}

questionInput.addEventListener("input", checkFormChanges);
answerInput.addEventListener("input", checkFormChanges);

function showStatus(message, ms = 3000) {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;

  statusEl.textContent = message;

  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    statusEl.textContent = "";
  }, ms);
}

function scrollToFAQ(index) {
  const list = document.getElementById("faqList");
  const items = list.querySelectorAll(".faq-item");
  const item = items[index];

  if (!item) return;

  item.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  item.classList.add("faq-saved-highlight");
  setTimeout(() => {
    item.classList.remove("faq-saved-highlight");
  }, 2500);
}
// ================= LOAD =================
function loadFAQs() {
 return fetch("faq/faqs.json?ts=" + Date.now())
    .then(res => {
      if (!res.ok) throw new Error("faq/faqs.json not found");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.warn("Admin FAQ data was object, converting:", data);
  	data = Object.values(data);
    }

      ADMIN_FAQS = data;
      renderFAQs(ADMIN_FAQS);
      return ADMIN_FAQS;
    })
    .catch(err => {
      console.error("Load error:", err);
      ADMIN_FAQS = [];
      renderFAQs([]);
      return ADMIN_FAQS;
    });
}

// ================= RENDER =================
function renderFAQs(data) {
  const list = document.getElementById("faqList");
  list.innerHTML = "";

  data.forEach((faq, index) => {
    const realIndex = faq.realIndex ?? index;

    const item = document.createElement("div");
    item.className = "faq-item";

    item.innerHTML = `
      <strong>${faq.q}</strong>
      <p>${faq.a}</p>
      <button onclick="startEdit(${realIndex})">Edit</button>
      <button onclick="deleteFAQ(${realIndex})">Delete</button>
    `;

    list.appendChild(item);
  });
}

// ================= ADD / EDIT =================
document.getElementById("faqForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let question = document.getElementById("question").value.trim();
  const answer = document.getElementById("answer").value.trim();

  const actionText = editIndex !== null ? "update" : "add";

  if (!confirm(`Are you sure you want to ${actionText} this FAQ?\n\n"${question}"`)) {
      return;
  }
  if (!question.endsWith("?")) {
    question += "?";
  }
  fetch("admin.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "saveFAQ",
      question,
      answer,
      editIndex: editIndex
    })
  })
  .then(res => res.json())
  .then(() => {
      const wasEdit = editIndex !== null;
      const savedQuestion = question;
      const oldIndex = editIndex;

      showStatus("Saved!");
      resetForm();

      return loadFAQs().then(() => {
    	let savedIndex;

    	if (wasEdit) {
      	   savedIndex = oldIndex;
    	} else {
           savedIndex = ADMIN_FAQS.findIndex(faq => faq.q === savedQuestion);
      	   if (savedIndex === -1) {
        	savedIndex = ADMIN_FAQS.length - 1;
      	   }
    	}

    	scrollToFAQ(savedIndex);
  });
})
  .catch(err => console.error(err));
});

// ================= EDIT =================
function startEdit(index) {
  const faq = ADMIN_FAQS[index];

  document.getElementById("question").value = faq.q;
  document.getElementById("answer").value = faq.a;

  editIndex = index;

  const cancelBtn = document.getElementById("cancelEdit");
  cancelBtn.style.display = "inline-block";

  // Scroll to form
  const form = document.getElementById("faqForm");
  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  // Optional: focus the question field
  document.getElementById("question").focus();
}


// ================= CANCEL =================
document.getElementById("cancelEdit").addEventListener("click", function (){
  const question = document.getElementById("question").value.trim();
  const answer = document.getElementById("answer").value.trim();

  // If nothing typed → just reset
  if (!question && !answer) {
    resetForm();
    return;
  }

  // If editing → compare to original
  if (editIndex !== null) {
    const original = ADMIN_FAQS[editIndex];

    if (question === original.q && answer === original.a) {
      resetForm();
      return;
    }
  }

  // Otherwise confirm discard
  if (confirm("Discard your changes?")) {
    resetForm();
  }
});

function resetForm() {
  document.getElementById("faqForm").reset();
  editIndex = null;
  document.getElementById("cancelEdit").style.display = "none";
}

// ================= DELETE =================
function deleteFAQ(index) {
  const faq = ADMIN_FAQS[index];
  if (!faq) return;

  if (!confirm(`Are you sure you want to delete this FAQ?\n\n"${faq.q}"`)) return;

  fetch("admin.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "saveFAQ",
      deleteIndex: index
    })
  })
  .then(res => res.json())
  .then(() => {
	showStatus("Deleted!");
	return loadFAQs();
  });
}

// ================= SEARCH =================
document.getElementById("searchAdmin").addEventListener("input", function (e) {
  const term = e.target.value.toLowerCase();

  // if empty → show full list
  if (!term) {
    renderFAQs(ADMIN_FAQS);
    return;
  }

  const filtered = ADMIN_FAQS
	.map((faq, i) => ({ ...faq, realIndex: i }))
	.filter(faq =>
		faq.q.toLowerCase().includes(term) ||
		faq.a.toLowerCase().includes(term)
	);

  renderFAQs(filtered);
});

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadFAQs);

// -- MANAGE WEB BUTTON LISTENERS --

// Dashboard --> Manage Website Main Panel
document.getElementById("manage-website-btn").addEventListener("click", () => {
	showPanel("manage-website-main");
});

// Manage Website Main Panel --> Back to Dashboard
document.getElementById("manage-website-back").addEventListener("click", () => {
	showPanel("dashboard");
});

// Manage Website Main Panel --> Welcome Message Panel
document.getElementById("manage-welcome-message-btn").addEventListener("click", () => {
	showPanel("manage-welcome-message");
	loadWelcomeEditor();
});

// Welcome Message Panel --> Back to Manage Website Main Panel
document.getElementById("welcome-back-btn").addEventListener("click", () => {
	showPanel("manage-website-main");
});

// Manage Website Main Panel --> Featured Video Panel
document.getElementById("manage-featured-video-btn").addEventListener("click", () => {
	showPanel("manage-featured-video");
	loadVideoEditor();
});

// Featured Video Panel --> Back to Manage Website Main Panel
document.getElementById("video-back-btn").addEventListener("click", () => {
	showPanel("manage-website-main");
});

// Manage Website Main Panel --> Awards Panel
document.getElementById("manage-awards-btn").addEventListener("click", () => {
	loadAwardsList();
	showPanel("manage-awards");
});

// Awards Panel --> Back to Manage Website Main Panel
document.getElementById("awards-back-btn").addEventListener("click", () => {
	showPanel("manage-website-main");
});

// Manage Website Main Panel --> Q&A Panel
document.getElementById("manage-qa-btn").addEventListener("click", () => {
	showPanel("manage-qa");
});

// Q&A Panel --> Back to Manage Website Main Panel
document.getElementById("qa-back-btn").addEventListener("click", () => {
	showPanel("manage-website-main");
});

//-----------------------------
// Super Admin Panel Stuff
// ----------------------------

//Super Admin Panel Navigation

document.getElementById("admin-back").addEventListener("click", () => {
	showPanel("dashboard");
});

document.getElementById("add-admin-btn").addEventListener("click", () => {
	showPanel("add-admin");
});

document.getElementById("add-admin-back").addEventListener("click", () => {
	showPanel("manage-admins");
	addAdminForm.reset();
	fetchAdmins();
});

document.getElementById("edit-admin-back").addEventListener("click", () => {
	showPanel("manage-admins");
});



function fetchAdmins() {
    fetch("admin.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "getAdmins" })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            adminAccounts = data.admins;
            loadAdminList(); // now render them
        } else {
            alert("Failed to load admins");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error loading admins: " + err.message);
    });
}

//Load List of Admins
function loadAdminList() {
	const list = document.getElementById("admin-list");
	list.innerHTML = "";

	adminAccounts.forEach((acc, index) => {
		const row = document.createElement("div");
		row.classList.add("edit-item");

		row.innerHTML = `
			<span class="item-name">${acc.username} (${acc.role})</span>
			<div class="edit-delete-admin-btns">
				<button class="edit-admin-btn" data-id="${acc.id}">Edit</button>
				<button class="delete-admin-btn" data-id="${acc.id}">Delete</button>
			</div>
		`;

		list.appendChild(row);
	});

	attachAdminEditButtons();
	attachAdminDeleteButtons();
}

//Button Click Handler
document.getElementById("manage-admins-btn").addEventListener("click", () => {
	if (currentRole !== "super") return alert("Unauthorized");

        showPanel("manage-admins");
	fetchAdmins();
});

//Handle Edit Button Clicks
function attachAdminEditButtons() {
	const buttons = document.querySelectorAll(".edit-admin-btn");

	buttons.forEach((btn) => {
		btn.addEventListener("click", () => {
			const id = btn.getAttribute("data-id");
			loadAdminIntoEditPanel(id);
			showPanel("edit-admin");
		});
	});
}

//Handle Delete Button Clicks
function attachAdminDeleteButtons() {
    document.querySelectorAll(".delete-admin-btn").forEach(btn => {
        btn.onclick = function () {
            const id = this.getAttribute("data-id");

            if (!confirm("Are you sure you want to delete this admin?")) {
                return;
            }

            fetch("admin.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "deleteAdmin",
                    id: id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
		                   
 		    // Clean popup notification
                        const popup = document.createElement("div");
                        popup.innerText = "Admin deleted successfully!";
                        popup.style.position = "fixed";
                        popup.style.top = "20px";
                        popup.style.right = "20px";
                        popup.style.background = "#28a745";
                        popup.style.color = "white";
                        popup.style.padding = "12px 18px";
                        popup.style.borderRadius = "6px";
                        popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                        popup.style.zIndex = "9999";

                        document.body.appendChild(popup);

                        setTimeout(() => {
                            popup.remove();
                        }, 3000);

                    fetchAdmins(); // reload list
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Delete failed");
            });
        };
    });
}



//Load Admin into Edit Panel 
function loadAdminIntoEditPanel(id) {
	const admin = adminAccounts.find(a => a.id == id);

	if (!admin) {
       		alert("Admin not found");
        	return;
    	}

	// Store ID in JS (NOT in the UI)
    	currentAdminId = admin.id;

	// Fill fields
	document.getElementById("edit-admin-username").value = admin.username;
	document.getElementById("edit-admin-role").value = admin.role;
	document.getElementById("edit-admin-fullname").value = admin.fullName;
	document.getElementById("edit-admin-email").value = admin.email;

	// Always clear password field
	document.getElementById("edit-admin-password").value = "";

	// Save button logic
	document.getElementById("edit-admin-save").onclick = (e) => {
		 e.preventDefault();

		const updatedAdmin = {
		    originalId: currentAdminId, //  WHERE uses this
		    username: document.getElementById("edit-admin-username").value.trim(),
		    role: document.getElementById("edit-admin-role").value,
		    fullName: document.getElementById("edit-admin-fullname").value.trim(),
		    email: document.getElementById("edit-admin-email").value.trim(),
		    password: document.getElementById("edit-admin-password").value.trim()
		};
		console.log(updatedAdmin);

		fetch("admin.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
			body: JSON.stringify({
				action: "updateAdmin",
				...updatedAdmin
			})
		})
		.then(res => res.json())
		.then(data => {
		if (data.success) {
			// Clean popup notification
			const popup = document.createElement("div");
			popup.innerText = "Admin updated successfully!";
			popup.style.position = "fixed";
			popup.style.top = "20px";
			popup.style.right = "20px";
			popup.style.background = "#28a745";
			popup.style.color = "white";
			popup.style.padding = "12px 18px";
			popup.style.borderRadius = "6px";
			popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
			popup.style.zIndex = "9999";

			document.body.appendChild(popup);

			setTimeout(() => {
			    popup.remove();
			}, 3000);


			showPanel("manage-admins");
			fetchAdmins(); // reload list from DB
		}  else {
         		alert("Error: " + data.message);
	        }
	
		})
		.catch(err => {
			console.error(err);
			alert("Error updating admin");
		});
	};

	// Back button
	document.getElementById("edit-admin-back").onclick = () => {
		showPanel("manage-admins");
	};
}


// -----------------------------
// Add Admin Form Submission
// -----------------------------

const addAdminForm = document.getElementById("addAdminForm");

if (addAdminForm) {
    addAdminForm.addEventListener("submit", function (e) {
        e.preventDefault(); // stop normal page reload
	

        const data = {
            action: "addAdmin",
            currentRole: currentRole,
            name: document.querySelector("[name='new-admin-name']").value,
            email: document.querySelector("[name='new-admin-email']").value,
            id: document.querySelector("[name='new-admin-id']").value,
            username: document.querySelector("[name='new-admin-username']").value,
            password: document.querySelector("[name='new-admin-password']").value,
            role: document.querySelector("[name='new-admin-role']").value
        };
	


        fetch("admin.php", {
            method: "POST",
	    headers: {
                "Content-Type": "application/json" 
            },
	    body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {

                // Clean popup notification
                const popup = document.createElement("div");
                popup.innerText = "Admin created successfully!";
                popup.style.position = "fixed";
                popup.style.top = "20px";
                popup.style.right = "20px";
                popup.style.background = "#28a745";
                popup.style.color = "white";
                popup.style.padding = "12px 18px";
                popup.style.borderRadius = "6px";
                popup.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
                popup.style.zIndex = "9999";

                document.body.appendChild(popup);

                setTimeout(() => {
                    popup.remove();
                }, 3000);

                addAdminForm.reset();

            } else {
                alert("Error: " + data.message);
            }

        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Something went wrong.");
        });
    });
}

const passwordField = document.getElementById("new-admin-password");
const reenterField = document.getElementById("new-admin-password-reenter");
const saveButton = document.getElementById("save-new-admin");

function checkPasswords() {
    const password = passwordField.value.trim();
    const reenter = reenterField.value.trim();

    // Only enable if both are filled AND match
    if (password.length > 0 && password === reenter) {
        saveButton.disabled = false;
        saveButton.style.opacity = "1";
        saveButton.style.cursor = "pointer";

        passwordField.style.border = "";
        reenterField.style.border = "";
    } else {
        saveButton.disabled = true;
        saveButton.style.opacity = "0.5";
        saveButton.style.cursor = "not-allowed";
    }
}

// Run check on typing in either field
passwordField.addEventListener("input", checkPasswords);
reenterField.addEventListener("input", checkPasswords);



const programSelect = document.getElementById("new-alumni-program");
const concentrationSelect = document.getElementById("new-alumni-concentration");

if (programSelect && concentrationSelect) {
    programSelect.addEventListener("change", function () {
        populateConcentrations(this.value, concentrationSelect);
    });
}


// -----------------------------
// Add Alumni Form Submission
// -----------------------------

const addAlumniForm = document.getElementById("addAlumniForm");

if (addAlumniForm) {
    addAlumniForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const fields = [
            { key: "first_name", el: document.querySelector("[name='new-alumni-first-name']") },
            { key: "last_name", el: document.querySelector("[name='new-alumni-last-name']") },
            { key: "job_title", el: document.querySelector("[name='new-alumni-job-title']") },
            { key: "employer", el: document.querySelector("[name='new-alumni-employer']") },
            { key: "job_setting", el: document.querySelector("[name='new-alumni-job-setting']") },
            { key: "bio", el: document.querySelector("[name='new-alumni-bio']") },
            { key: "photo_url", el: document.querySelector("[name='new-alumni-photo-url']") },
            { key: "start_date", el: document.querySelector("[name='new-alumni-start-date']") },
            { key: "end_date", el: document.querySelector("[name='new-alumni-end-date']") },
            { key: "program", el: document.querySelector("[name='new-alumni-program']") },
            { key: "concentration", el: document.querySelector("[name='new-alumni-concentration']") }
        ];

        for (let field of fields) {
            if (!field.el.value.trim()) {
                alert(field.key.replaceAll("_", " ") + " is required."); // ✅ FIX
                field.el.focus();
                return;
            }
        }

        // ✅ FIX: correct name
        const imageInput = document.querySelector("[name='new-alumni-image']");

        if (!imageInput || imageInput.files.length === 0) {
            alert("Image is required.");
            return;
        }

        const formData = new FormData();
        formData.append("action", "addAlumni");

        fields.forEach(field => {
            formData.append(field.key, field.el.value);
        });

        formData.append("new_alumni_image", imageInput.files[0]);

        fetch("admin.php", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Alumni created successfully!");
                addAlumniForm.reset();
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Something went wrong.");
        });
    });
}

// ================================================
// Making dynamic dropdown for alumni concentration
// ================================================

const concentrationsByProgram = {
	"BS in Exercise Science": [
        	"Exercise Physiology",
       		"Golf Performance",
        	"Nutrition and Fitness",
        	"Wellness and Human Performance"
    	],
    	"MS in Exercise Science and Health Promotion": [
        	"Advanced Golf Performance",
        	"Applied Sport Science",
        	"Group Fitness Leadership",
        	"Nutrition",
        	"Performance Enhancement and Injury Prevention",
        	"Rehabilitation Science",
        	"Sport Psychology",
        	"Tactical Strength and Conditioning",
        	"Wellness and Fitness",
        	"Wellness Coaching"
    ],
    "DHSc in Health Science and Exercise Leadership": [],
    "MS in Sport Management": [],
    "MS in Athletic Training": []
};

function populateConcentrations(program, concentrationSelect, selectedValue = "") {
    concentrationSelect.innerHTML = "";

    if (!program) {
        concentrationSelect.disabled = true;
        concentrationSelect.innerHTML = "<option>Select a program first</option>";
        return;
    }

    const concentrations = concentrationsByProgram[program];

    if (!concentrations || concentrations.length === 0) {
        concentrationSelect.disabled = true;

        const option = document.createElement("option");
        option.textContent = "No concentration";
        option.value = "No concentration";
        concentrationSelect.appendChild(option);
        return;
    }

    concentrationSelect.disabled = false;

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select concentration";
    defaultOption.value = "";
    concentrationSelect.appendChild(defaultOption);

    concentrations.forEach(concentration => {
        const option = document.createElement("option");
        option.value = concentration;
        option.textContent = concentration;

        // ✅ Auto-select if editing
        if (concentration === selectedValue) {
            option.selected = true;
        }

        concentrationSelect.appendChild(option);
    });
}





