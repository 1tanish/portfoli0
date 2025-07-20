const updateFormAuth = document.getElementById("updateFormAuth");
const updateInpAuth = document.getElementById("updateInpAuth");
const updateInp = document.getElementById("updateInp");
const updatelist = document.querySelector(".updatelist");
const todolist = document.querySelector(".todolist");
const statuslogpage = document.getElementById("statuslogpage");
const statusForm = document.getElementById("newStatusForm");
const newStatusInp = document.querySelector("#newStatusForm input");
const adminForm = document.getElementById("statusAdminForm");
const adminFormInp = document.querySelector("#statusAdminForm input");
let updateFormListenerAdded = false;

//////////word scramble
window.addEventListener("load", () => {
  showNowOrLastPlayed();
  wordScramble();
});

function wordScramble() {
  const words = ["sin/cos", "tan"];
  const chars = "¿?!¡{}░<>/\\";
  const el = document.getElementById("scramble");
  let index = 0;

  function randomchar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }
  function scrambleEffect(targetWord, interval = targetWord == "tan" ? 100 : 50) {
    return new Promise((resolve) => {
      let revealed = 0;
      const scrambleInterval = setInterval(() => {
        let text = "";

        for (i = 0; i < targetWord.length; i++) {
          if (i < revealed) {
            text += targetWord[i];
          } else {
            text += randomchar();
          }
        }
        el.textContent = text;
        revealed++;

        if (revealed > targetWord.length) {
          clearInterval(scrambleInterval);
          el.textContent = targetWord;
          resolve();
        }
      }, interval);
    });
  }
  async function loopWords() {
    while (true) {
      currWord = words[index];
      nextIndex = (index + 1) % words.length;
      nextWord = words[nextIndex];

      el.textContent = currWord;
      await new Promise((r) => setTimeout(r, 1000));

      await scrambleEffect(nextWord);
      el.textContent = nextWord;
      await new Promise((r) => setTimeout(r, 1000));

      index = nextIndex;
    }
  }
  loopWords();
}

/////////////////// home page
function daytime() {
  const daytime = document.getElementById("daytime");
  const curr = new Date();
  daytime.innerText = `${curr.toLocaleDateString()}`;

  const date = document.getElementById("update_date");
  date.innerText = `[${curr.toLocaleDateString("en-GB").split("/").reverse().join("")}]`;
}
daytime();

function imageclickbig() {
  const imgwrap = document.querySelector(".imgwrap");
  const img = document.querySelector(".imgwrap img");
  imgwrap.addEventListener("click", () => {
    img.classList.toggle("imgclicked");
    img.classList.toggle("img1");
  });
}
imageclickbig();

async function updatelistdisplay() {
  let sum = "";
  try {
    const res = await fetch("/get-updates");
    const myupdates = await res.json();

    myupdates.reverse().forEach((update) => {
      sum += `<li class="leading-[1]">
                <h1><span class="taskcomp text-[var(--pntd)] font-bold">${update.date}: </span><span class="taskcontent">${update.text}</span></h1>
              </li>`;
    });
  } catch (error) {
    sum = `<li class="text-white"><span class='text-red-500 uppercase'>Error: </span>Can't load updates.</li>`;
    console.error("Failed to load updates:", error);
  }

  updatelist.innerHTML = sum;
}
updatelistdisplay();

function handleUpdateLogout(message) {
  sessionStorage.removeItem("authUpdateToken");
  updateInp.classList.add("hidden");
  updateInp.disabled = true;
  updateInp.value = "";
  updateInpAuth.value = "";
  if (message) {
    alert(message);
  }
}
handleUpdateLogout();

function logoutbtn() {
  document.getElementById("update_date").addEventListener("click", () => {
    if (updateInp.classList.contains("hidden")) {
      alert("enter a pin first");
      return;
    }
    handleUpdateLogout();
  });
}
logoutbtn();

function authUpdate() {
  updateFormAuth.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userPass = updateInpAuth.value;
    try {
      const auth = await fetch("/auth-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass: userPass }),
      });
      const msg = auth.status === 200 ? await auth.json() : await auth.text();
      if (auth.status === 200) {
        updateInp.classList.remove("hidden");
        updateInp.disabled = false;
        sessionStorage.setItem("authUpdateToken", msg.token);
        updateInp.focus();
        addupdate();
      } else if (auth.status == 400) {
        handleUpdateLogout(msg);
      } else {
        handleUpdateLogout(msg);
      }
    } catch (error) {
      console.log(error);
    }
  });
}
authUpdate();

function addupdate() {
  if (updateFormListenerAdded) {
    return;
  }
  const updtform = document.getElementById("updateForm");
  const updateinp = document.getElementById("updateInp");

  updtform.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newupdate = updateinp.value;
    updateinp.value = "";
    const updateToken = sessionStorage.getItem("authUpdateToken");

    try {
      const res = await fetch("/submit-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${updateToken}`,
        },
        body: JSON.stringify({ text: newupdate }),
      });
      const msg = await res.text();
      if (res.status === 200) {
        updatelistdisplay();
      } else if (res.status === 401 || res.status === 403) {
        handleUpdateLogout(msg || "Session expired. Please enter pin again");
      } else {
        handleUpdateLogout(msg);
      }
    } catch (error) {
      console.error("Failed to submit update:", error);
    }
  });
}

async function todolistdisplay() {
  let sum = "";

  try {
    const todos = await fetch("/get-todos");
    const mytodos = await todos.json();

    mytodos.sort((a, b) => a.done - b.done).forEach((mytodo, idx) => {
      sum += `<li id=${idx} class="leading-[1] ${mytodo.done == true ? "line-through" : ``}" >
                <span class="taskcomp text-[var(--pntd)] font-bold">>/. </span>
                <span class="taskcontent">${mytodo.text}</span>
              </li>`;
    });
  } catch (error) {
    sum = `<li class="text-white"><span class='text-red-500 uppercase'>Error: </span>Can't load updates.</li>`;
    console.error("Failed to load toDos:", error);
  }

  todolist.innerHTML = sum;
}
todolistdisplay();

function OpenPages() {
  const pages = document.querySelectorAll(".page");
  const navlinks = document.querySelectorAll(".navlinksbox li");
  const navbar = document.getElementById("navbar");

  navbar.addEventListener("click", (e) => {
    const clicked = e.target.closest("li");
    if (!clicked || !clicked.dataset.id) return;

    const targetId = clicked.dataset.id;
    const targetPage = document.querySelector(`.page[id="${targetId}"]`);
    if (!targetPage) return;

    pages.forEach((page) => page.classList.add("hidden"));
    targetPage.classList.remove("hidden");
    location.hash = targetPage.dataset.id;
    // history.replaceState(null, "", window.location.pathname.split("/")[0] + targetPage.dataset.id);

    navlinks.forEach((link) => {
      link.classList.remove("activeTab");
      link.classList.add("inactiveTab");
    });

    clicked.classList.add("activeTab");
    clicked.classList.remove("inactiveTab");
  });
}
OpenPages();

function statuslogopen() {
  const mainbox = document.getElementById("mainbox");

  const statusloglink = document.querySelector(".statusloglink");
  statusloglink.addEventListener("click", () => {
    mainbox.classList.toggle("hidden");
    statuslogpage.classList.toggle("hidden");
    statuslogpage.focus();
  });
}
statuslogopen();

async function showNowOrLastPlayed() {
  const spotifystatus = document.querySelector(".spotifystatus");
  const onlinestatus = document.querySelector(".onlinestatus");
  try {
    const nowRes = await fetch("/currently-playing");

    if (nowRes.status === 204) {
      throw new Error("Nothing is currently playing");
    }

    const now = await nowRes.json();

    if (now.playing && now.data && now.data.is_playing) {
      const track = now.data.item;
      const tracklink = track.external_urls.spotify;
      spotifystatus.innerHTML = `<a href="${tracklink}" target="_blank"><span class="text-[var(--priclr)]">Now Playing:</span> ${track.name} ~ ${track.artists.map((a) => a.name).join(", ")}</a>`;
      onlinestatus.classList.replace("text-[var(--off)]", "text-[var(--on)]");
    } else {
      throw new Error("Paused or not actively playing");
    }
  } catch (err) {
    try {
      const lastRes = await fetch("/my-recently-played");
      const last = await lastRes.json();

      if (last.items && last.items.length > 0) {
        const track = last.items[0].track;
        const tracklink = track.external_urls.spotify;
        spotifystatus.innerHTML = `<a href="${tracklink}" target="_blank"><span class="text-[var(--secclr)]">Last Played:</span> ${track.name} — ${track.artists.map((a) => a.name).join(", ")}</a>`;
        onlinestatus.classList.replace("text-[var(--on)]", "text-[var(--off)]");
      } else {
        spotifystatus.textContent = "No recently played tracks.";
      }
    } catch {
      spotifystatus.textContent = "Error loading playback.";
    }
  }
  spotifystatus.classList.add("spotifystatusAnim"); // for adding animation to the current textcontent
}
///////////////////////////////////////////status page

function statuslogexit() {
  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape" && mainbox.classList.contains("hidden") && !statuslogpage.classList.contains("hidden")) {
      mainbox.classList.toggle("hidden");
      statuslogpage.classList.toggle("hidden");
      handleStatusLogout();
    }
  });
  document.getElementById("statusLogExit").addEventListener("click", () => {
    mainbox.classList.toggle("hidden");
    statuslogpage.classList.toggle("hidden");
    handleStatusLogout();
  });
}
statuslogexit();

function handleStatusLogout(message) {
  sessionStorage.removeItem("authToken");
  newStatusInp.disabled = true;
  newStatusInp.value = "";
  adminFormInp.value = "";
  if (message) {
    alert(message);
  }
}
handleStatusLogout();

async function statusLogDisplay() {
  const latestStatusBox = document.getElementById("lateststatus");
  const statuslist = document.getElementById("statuslist");
  let sum = "";
  let latestStatus = "";
  let latestStatusDate = "";
  try {
    const statuses = await fetch("/get-statuses");
    const myStatuses = await statuses.json();
    latestStatus = myStatuses[myStatuses.length - 1].status;
    latestStatusDate = myStatuses[myStatuses.length - 1].date.slice(0, 10).replace(/-/g, "");

    myStatuses.reverse().forEach((myStatus, idx) => {
      const curr = new Date();
      const statusDate = new Date(myStatus.date);

      curr.setHours(0, 0, 0, 0);
      statusDate.setHours(0, 0, 0, 0);

      const daysago = Math.floor((curr - statusDate) / (1000 * 60 * 60 * 24));

      sum += `<article id="status${idx}" class="flex flex-col gap-1">
              <h1 class="flex gap-2 items-center"><span class="username underline font-[georgia] font-bold text-[14px]">tanish</span><span class="daysPassed text-[var(--secclr)]">~ ${daysago} days ago</span></h1>
              <p class="statuscontent pl-[15px] text-[var(--stpri)] leading-[1.3]">${myStatus.status}</p>
            </article>`;
    });
  } catch (error) {
    sum = `<article class="text-white"><span class='text-red-500 uppercase'>Error: </span>Can't load Statuses.</article>`;
  }
  statuslist.innerHTML = sum;
  latestStatusBox.textContent = `[${latestStatusDate}] ${latestStatus}`;
}
statusLogDisplay();

function authStatus() {
  newStatusInp.disabled = true;
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const adminPassInp = adminFormInp.value;

    try {
      const auth = await fetch("/auth-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassInp }),
      });
      const msg = auth.status === 200 ? await auth.json() : await auth.text();
      if (auth.status === 200) {
        const token = msg.token;
        sessionStorage.setItem("authToken", token);
        newStatusInp.disabled = false;
        newStatusInp.focus();
        addStatus();
      } else if (auth.status === 400) {
        handleStatusLogout(msg);
      } else {
        handleStatusLogout(msg);
      }
    } catch (error) {
      console.log(error);
    }
  });
}
authStatus();

function checkTokenValidity() {
  const token = sessionStorage.getItem("authToken");
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      handleStatusLogout("Session expired. Please re-authenticate.");
    }
  } catch {
    handleStatusLogout("Invalid session. Please log in again.");
  }
}
checkTokenValidity();

let statusFormListenerAdded = false;
function addStatus() {
  if (statusFormListenerAdded) return;
  statusFormListenerAdded = true;

  statusForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newStatus = newStatusInp.value;
    const token = sessionStorage.getItem("authToken");
    try {
      const res = await fetch("/submit-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const msg = await res.text();
      if (res.status == 200) {
        statusLogDisplay();
        newStatusInp.value = "";
      } else if (res.status === 401 || res.status === 403) {
        handleStatusLogout(msg || "Session expired. Please log in again.");
      } else {
        handleStatusLogout(msg);
      }
    } catch (error) {
      console.log(error);
    }
  });
}
