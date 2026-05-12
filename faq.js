let FAQ_DATA = [];

//---- String Similarity ----------------
// Returns similarity between 0 and 1
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (!longer.length) return 1.0;
  const editDist = levenshtein(longer, shorter);
  return (longer.length - editDist) / parseFloat(longer.length);
}

// Levenshtein distance function
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}
//------------ DOM Logic ---------------- 
document.addEventListener("DOMContentLoaded", () => {
  const faqIcon = document.querySelector(".faq-icon");
  const faqPanel = document.getElementById("faqPanel");
  const footer = document.querySelector(".footer-container");
  const content = document.getElementById("faqContent");
  const input = document.getElementById("faqInput");
  const sendBtn = document.getElementById("faqSend");

  if (!faqIcon || !faqPanel) return;
 // ---------------- FETCH TXT ---------------- 

  fetch("faq/faqs.json?ts=" + Date.now()) // adjust if needed
 	.then(res => {
           if (!res.ok){ 
		throw new Error("faq/faqs.json not found");
	   }
           return res.json(); 
	 })
	.then(data => {

           if (!Array.isArray(data)) {
	         console.warn("FAQ data was object, converting:", data);
   		 data = Object.values(data);
	   }

           FAQ_DATA = data;
        })
        .catch(err => console.error("FAQ load error:", err));
 
  // ---------------- PANEL TOGGLE ----------------

  faqIcon.addEventListener("click", () => {
    faqPanel.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!faqPanel.contains(e.target) && !faqIcon.contains(e.target)) {
      faqPanel.classList.remove("open");
    }
  });

  // ---------------- FOOTER MERGE ----------------
if (footer) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      faqIcon.classList.toggle("in-footer", entry.isIntersecting);
      faqPanel.classList.toggle("in-footer", entry.isIntersecting);
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  observer.observe(footer);
}
  /* ---------------- SIMPLE SEND ---------------- */
function normalizeWords(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function keywordScore(userWords, questionWords) {
  let matches = 0;

  userWords.forEach(word => {
    if (questionWords.some(qw => qw.includes(word) || word.includes(qw))) {
      matches++;
    }
  });

  return matches / userWords.length;
}
function reloadFAQData() {
    return fetch("faq/faqs.json?ts=" + Date.now())
    .then(res => {
      if (!res.ok) throw new Error("Failed to load FAQ");
      return res.json();
    })
    .then(data => {

      // 🔥 FIX: auto-convert object → array
      if (!Array.isArray(data)) {
        console.warn("FAQ was object, converting:", data);
        data = Object.values(data);
      }

      FAQ_DATA = data;

      console.log("FAQ reloaded:", FAQ_DATA);
    })
    .catch(err => {
      console.error("Reload failed:", err);
      FAQ_DATA = [];
    });
}
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    await reloadFAQData();
   // Add user bubble
    const userBubble = document.createElement("div");
    userBubble.className = "faq-user";
    userBubble.textContent = text;
    content.appendChild(userBubble);
  // SCORE ALL QUESTIONS
    const userWords = normalizeWords(text);
   
    const ranked = FAQ_DATA.map(item => {

    const questionWords = normalizeWords(item.q);

    const similarityScore = similarity(text, item.q);
    const wordScore = keywordScore(userWords, questionWords);

  return {
    ...item,
    score: (similarityScore * 0.6) + (wordScore * 0.4)
  };

})
.filter(item => item.score > 0.3)
.sort((a,b) => b.score - a.score)
.slice(0,4);
  if (ranked.length && ranked[0].score > 0.75) {
  // High-confidence: show top answer directly
  const answer = document.createElement("div");
  answer.className = "faq-bot";
  answer.innerHTML = ranked[0].a;
  content.appendChild(answer);

} else if (ranked.length) {
  // Lower-confidence: show suggestions
  const botBubble = document.createElement("div");
  botBubble.className = "faq-bot";
  botBubble.innerHTML = `
    I found some similar questions. Click one:
    <div class="faq-suggestions"></div>
  `;
  const list = botBubble.querySelector(".faq-suggestions");

  ranked.forEach(item => {
    const btn = document.createElement("div");
    btn.className = "faq-suggestion";
    btn.textContent = item.q;

    btn.addEventListener("click", () => {
      // show chosen question
      const chosenQ = document.createElement("div");
      chosenQ.className = "faq-user";
      chosenQ.textContent = item.q;
      content.appendChild(chosenQ);

      // show answer
      const answer = document.createElement("div");
      answer.className = "faq-bot";
      answer.innerHTML = item.a;
      content.appendChild(answer);

      content.scrollTop = content.scrollHeight;
    });

    list.appendChild(btn);
  });

  content.appendChild(botBubble);

} else {
  // No match: fallback
  const botBubble = document.createElement("div");
  botBubble.className = "faq-bot";
  botBubble.innerHTML = `
    Sorry, I couldn't find anything close.
    <br>
    You can browse the full FAQ here:
    <a href="faq/Exercise Science and Health Promotion Graduate Program FAQs.pdf" target="_blank">
    View FAQ PDF
    </a>
  `;
  content.appendChild(botBubble);
}

  input.value = "";
  content.scrollTop = content.scrollHeight;
}


  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
});


