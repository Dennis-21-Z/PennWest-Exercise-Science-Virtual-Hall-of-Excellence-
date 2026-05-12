function loadIntro() {
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
            console.error("Intro load failed");
            return;
        }

        // -----------------------
        // Text fields
        // -----------------------
        if (data.data.Header) {
            document.getElementById("welcome-heading").innerText = data.data.Header;
        }

        if (data.data.OpMsg) {
            document.getElementById("welcome-message").innerText = data.data.OpMsg;
        }

        // Optional second message (only if you actually use it)
        if (data.data.OpMsg2) {
            document.getElementById("welcome-message-2").innerText = data.data.OpMsg2;
        }

	console.log("RAW intro data:", data.data);

        // -----------------------
        // Featured Video
        // -----------------------
        
	if (data.data.FeatVid) {
	    let url = data.data.FeatVid;
	    let videoId = "";

	    try {
		const parsedUrl = new URL(url);

		// youtu.be short link
		if (parsedUrl.hostname.includes("youtu.be")) {
		    videoId = parsedUrl.pathname.slice(1);
		}

		// youtube.com link
		else if (parsedUrl.hostname.includes("youtube.com")) {
		    videoId = parsedUrl.searchParams.get("v");
		}

		// fallback (already ID)
		else {
		    videoId = url;
		}

	    } catch (e) {
		// If it's not even a valid URL, assume it's already an ID
		videoId = url;
	    }

	    document.getElementById("featured-video").src =
		"https://www.youtube.com/embed/" + videoId;
	}
        
    })
    .catch(err => console.error("Intro load error:", err));
}

document.addEventListener("DOMContentLoaded", loadIntro);







const API_URL = 'api.php';
let ALL_ALUMNI = [];

console.log('Script starting...');

function escapeHtml(str) {
	if(!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

//Fetch alumni data from the PHP API
fetch(`${API_URL}?action=getAllAlumni`)
	.then((response) => {
		console.log('Response status:', response.status);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json();
	})
	.then((alumni) => {
	//	console.log('Alumni data received:', alumni);

		ALL_ALUMNI = alumni || [];
		renderAlumni(ALL_ALUMNI);
	})
	.catch((error) => {
    		console.error("Error in fetch:", error);
    		const alumniGrid = document.getElementById("alumniGrid");
    		if (alumniGrid) {
      			alumniGrid.innerHTML =
        			"<p>Error loading alumni data: " + error.message + "</p>";
    	}
	});

function getAlumniImagePath(name) {
	let cleanedName = name.replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
	return `Images/Exercise Science Alumni/${cleanedName}`;
}

async function loadImageWithFallbacks(imgElement, basePath, extensions) {
	const nameOnly = basePath.replace('Images/Exercise Science Alumni/', '');
	
	try {
		const response = await fetch(`${API_URL}?action=getAlumniImagePath&name=${encodeURIComponent(nameOnly)}`)
		const data = await response.json();

		if(data && data.path) {
			imgElement.src = data.path;
			console.log(`Successfully loaded: ${data.path}`);
			return true;
		}
	}
	catch(e) {
		console.log('Error checking server for image:', e);
	}
}

function renderAlumni(alumniList){
	const alumniGrid = document.getElementById("alumniGrid");

	if(!alumniGrid) {
		console.error('Alumni grid element not found!');
		return;
	}

	//Clear any placeholder content
	alumniGrid.innerHTML = '';

	if(!alumniList || alumniList.length === 0) {
		alumniGrid.innerHTML = "<p>No alumni data available</p>";
	}     
	//Loop through each alumni and create a card
	alumniList.forEach((person, index) => {
		const alumniCard = document.createElement("div");
                alumniCard.classList.add("alumni-card");
                console.log('person.image:', person.image, 'person.name:', person.name);
 
			// const photoHTML = person.image && person.image.trim() !== ''
			//? `<img src="${person.image}" alt="${person.name}" loading="lazy">`
                        //: `<div class="placeholder-img"><i class="bi bi-person-circle"></i></div>`;

                const pennwestId = person.pennwestId
                if(!pennwestId) {
			console.error('Missing PennWest ID for:', person.name);
                        return;
                }

		const photoContainer = document.createElement("div");
		photoContainer.classList.add("alumni-photo");

		const img = document.createElement('img');
		img.alt = person.name;
		img.loading = "lazy";

		let imagePath = person.image;
		let basePath = null;
		let fileExtension = null;

		if(imagePath && imagePath.trim() !== '') {
			imagePath = imagePath.replace(/[\r\n]+/g, '').trim();
			const extensionMatch = imagePath.match(/\.(avif|webp|jpg|jpeg|png)$/i);
			if(extensionMatch) {
				fileExtension = extensionMatch[1];
				basePath = imagePath.replace(/\.(avif|webp|jpg|jpeg|png)$/i, '');
			}
			else {
				basePath = imagePath;
			}

			console.log(`Cleaned path for ${person.name}: ${basePath}, extension: ${fileExtension}`);
		}

		if(basePath && basePath !== '') {
			if(fileExtension) {
				const fullPath = `${basePath}.${fileExtension}`;
				console.log(`Trying database path: ${fullPath}`);
				img.src = fullPath;
				img.onerror = () => {
					console.log(`Failed to load ${fullPath}, trying fallbacks`);
					const extensions = ['avif', 'webp', 'jpg', 'jpeg', 'png'];
					loadImageWithFallbacks(img,basePath,extensions);
				};
			}
			else {
				const extensions = ['avif', 'webp', 'jpg', 'jpeg', 'png'];
				loadImageWithFallbacks(img,basePath, extensions);
			}
		}
		
		//const extensions = ['avif', 'webp', 'jpg', 'jpeg', 'png'];
		//const basePath = getAlumniImagePath(person.name);
		//loadImageWithFallbacks(img, basePath, extensions);

		photoContainer.appendChild(img);

		const contentDiv = document.createElement("div");
		contentDiv.classList.add("alumni-card-content");

		contentDiv.innerHTML = `
			<h3>${escapeHtml(person.name)}</h3>
			<p>${escapeHtml(person.jobTitle || '')}</p>
			<p>${escapeHtml(person.employer || '')}</p>
			<button class="view-profile-btn">View Profile</button>
		`;

		alumniCard.appendChild(photoContainer);
		alumniCard.appendChild(contentDiv);

		alumniCard.addEventListener('click', (e)=> {
			if(!e.target.closest('.view-profile-btn')) {
				sessionStorage.setItem('selectedAlumni', JSON.stringify(person));
				sessionStorage.setItem('selectedAlumniPennWestId', pennwestId);
				window.location.href = `bio.html?id=${pennwestId}`;
			}
		});
		
		const viewBtn = contentDiv.querySelector(".view-profile-btn");
		if(viewBtn) {
			viewBtn.addEventListener('click', (e)=> {
				e.stopPropagation();
				window.location.href = `bio.html?id=${pennwestId}`;
			});
		}
	
		alumniGrid.appendChild(alumniCard);
	});
}

                //Set the HTML content for the alumni card
                //alumniCard.innerHTML = `
                        //<div class="alumni-photo">
				//${photoHTML}
                       // </div>
                        //<div class="alumni-card-content">
                                 //<h3 style="color: #001F3C;">${person.name}</h3>
                                 //<p>${person.jobTitle}</p>
                                // <p>${person.employer}</p>
                                 //<button onclick="window.location.href='bio.html?id=${pennwestId}'" class="view-profile-btn">View Profile</button>
                       // </div>
                //`;

                 //alumniCard.addEventListener('click', (e) => {
                        //if(!e.target.closest('.view-profile-btn')) {
				//e.preventDefault();

                                //sessionStorage.setItem('selectedAlumni', JSON.stringify(person));
                                //sessionStorage.setItem('selectedAlumniPennWestId', pennwestId);

                                //window.location.href = `bio.html?id=${pennwestId}`;
                        //}
               // });

		// Button Click
		//alumniCard
			//.querySelector(".view-profile-btn")
			//.addEventListener("click", () => {
				//window.location.href = `bio.html?id=${pennwestId}`;
		//});
                //Add the card to the grid
                //alumniGrid.appendChild(alumniCard);
         //});
	 //console.log('Alumni cards created successfully');

	//}
// Find Alumni Section ------------------------------
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

function performSearch(queryText) {
  if (!searchInput) return;

  let query;

  // If called by event listener
  if (typeof queryText === "object") {
    query = queryText.target.value;
  }
  // If called manually with text
  else if (typeof queryText === "string") {
    query = queryText;
  }
  // fallback
  else {
    query = searchInput.value;
  }

  query = query.toLowerCase().trim();

  if (!query) {
    renderAlumni(ALL_ALUMNI);
    return;
  }

  const queryWords = query
    .split(/\s+/)
    .filter((word) => word.length > 1);

  const filtered = ALL_ALUMNI.filter((person) => {
    const searchableText = (
      (person.name || "") +
      " " +
      (person.jobTitle || "") +
      " " +
      (person.employer || "") +
      " " +
      (person.jobSetting || "")
    ).toLowerCase();

    return queryWords.every((word) =>
      searchableText.includes(word)
    );
  });

  renderAlumni(filtered);

  // Smooth scroll to results
  const alumniGrid = document.getElementById("alumniGrid");
  if (alumniGrid) {
    alumniGrid.scrollIntoView({ behavior: "smooth" });
  }
}

// Button click
if (searchButton) {
  searchButton.addEventListener("click", () =>  performSearch());
}

// Enter key support
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    // If input is empty, show all alumni
    if (!query) {
      renderAlumni(ALL_ALUMNI);
      return;
    }

    performSearch();
  
  });
}
// Live search when typing
if (searchInput){
  searchInput.addEventListener("input", performSearch);
}

// RECENT INDUCTEES CAROUSEL ------------------------------
document.addEventListener("DOMContentLoaded", () => {

  fetch(`${API_URL}?action=getRecentInductees`)
    .then(response => response.json())
    .then(data => {
	      if (!Array.isArray(data)) {
    console.error("Unexpected response:", data);
    return;
  }
      const track = document.querySelector(".inductees-track");
      track.innerHTML = "";
	const dotsContainer = document.querySelector(".carousel-dots-overlay");
	dotsContainer.innerHTML = "";

	const actionShots = [ 
		"Images/Background Images/actionshot1.png",
		"Images/Background Images/actionshot2.png",
		"Images/Background Images/actionshot3.png"
	];
      data.forEach((person,index) => {
	const backgroundImage = actionShots[index % actionShots.length];

        const slide = document.createElement("div");
        slide.classList.add("inductee-slide");

	 // Apply background to slide (correct element)
	slide.style.backgroundImage = `url('${backgroundImage}')`;

	const altText = `Photo of ${person.name}, ${person.jobTitle} at ${person.employer}`;

        slide.innerHTML = `
          <div class="inductee-center-card">
            <img src="${person.image}" class="inductee-avatar" alt="${escapeHtml(altText)}" />
            <h3>${person.name}</h3>
            <p>${person.jobTitle}</p>
		<p>${person.employer}</p>
	   
            <a href="bio.html?id=${person.pennwestId}"
               class="bio-link">
               View Profile
            </a>
	
          </div>
        `;

        track.appendChild(slide);
	const dot = document.createElement("button");
	dot.classList.add("dot");

	dot.textContent = `Slide ${index + 1}`;
	dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
	
	if (index === 0) {
 		dot.classList.add("active");
	}	

	dotsContainer.appendChild(dot);

      });

      initializeCarousel();

    })
    .catch(error => console.error("Error loading inductees:", error));


  function initializeCarousel() {

    const slides = Array.from(document.querySelectorAll(".inductee-slide"));
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");
    const dots = Array.from(document.querySelectorAll(".carousel-dots-overlay .dot"));

    if (slides.length === 0) return;

    let currentIndex = 0;

    function updateCarousel(index) {
      currentIndex = (index + slides.length) % slides.length;
      document.querySelector(".inductees-track")
        .style.transform = `translateX(-${currentIndex * 100}%)`;

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }

    prevBtn.addEventListener("click", () => {
      updateCarousel(currentIndex - 1);
    });

    nextBtn.addEventListener("click", () => {
      updateCarousel(currentIndex + 1);
    });

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => updateCarousel(i));
    });

    setInterval(() => {
      updateCarousel(currentIndex + 1);
    }, 15000);
  }	  
});




console.log("Script loaded");
