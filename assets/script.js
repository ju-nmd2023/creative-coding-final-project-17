const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const toggleButton = document.getElementById("toggle-sections");
const header = document.getElementById("header");
const mainSection = document.querySelector("main");
let sectionsVisible = true;

toggleButton.addEventListener("click", () => {
  sectionsVisible = !sectionsVisible;
  header.classList.toggle("hidden");
  mainSection.classList.toggle("hidden");
  toggleButton.classList.toggle("active");
});
const githubLink = document.getElementById("github");
const nameText = document.getElementById("name");
const descriptionText = document.getElementById("description");
const backgroundText = document.getElementById("background");
const p5container = document.getElementById("p5container");

let currentExperiment = 0;
let experiments = [];

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    experiments = data;
    if (experiments.length > 0) {
      goToExperiment(0);
    }
  });

function goToExperiment(index) {
  const experiment = experiments[index];
  if (!experiment) {
    return;
  }
  p5container.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  const bodyElement = document.createElement("div");

  const p5script = document.createElement("script");
  p5script.type = "text/javascript";
  p5script.src = "assets/p5.min.js";
  p5script.defer = true;
  bodyElement.appendChild(p5script);

  const toneScript = document.createElement("script");
  toneScript.type = "text/javascript";
  toneScript.src = "https://unpkg.com/tone";
  toneScript.defer = true;
  bodyElement.appendChild(toneScript);

  // Tone JS MIDI
  const toneMidiScript = document.createElement("script");
  toneMidiScript.type = "text/javascript";
  toneMidiScript.src = "https://unpkg.com/@tonejs/midi";
  toneMidiScript.defer = true;
  bodyElement.appendChild(toneMidiScript);

  // Load dependencies first if they exist
  if (experiment.dependencies && Array.isArray(experiment.dependencies)) {
    experiment.dependencies.forEach((depFile) => {
      const depScript = document.createElement("script");
      depScript.type = "text/javascript";
      depScript.src = depFile;
      depScript.defer = true;
      bodyElement.appendChild(depScript);
    });
  }

  const codeScript = document.createElement("script");
  codeScript.type = "text/javascript";
  codeScript.src = experiment.file;
  codeScript.defer = true;
  bodyElement.appendChild(codeScript);

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = "assets/iframe.css";
  bodyElement.appendChild(styleLink);

  iframe.srcdoc = bodyElement.innerHTML;
  p5container.appendChild(iframe);

  nameText.innerText = experiment.name;
  descriptionText.innerText = experiment.description;
}

nextButton.addEventListener("click", () => {
  currentExperiment++;
  if (currentExperiment >= experiments.length) {
    currentExperiment = 0;
  }
  goToExperiment(currentExperiment);
});

prevButton.addEventListener("click", () => {
  currentExperiment--;
  if (currentExperiment < 0) {
    currentExperiment = experiments.length - 1;
  }
  goToExperiment(currentExperiment);
});
