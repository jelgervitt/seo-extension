// Manifest V3 requires async functions

// get id of tab that was open before popup

const getTabId = async function () {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
};

// inject script into page that needs to be processed, return

const injectScript = async function () {
  getTabId().then((theTab) => {
    chrome.scripting
      .executeScript({
        target: { tabId: theTab },
        files: ["./js/content-script.js"],
      })

      //TODO remove this after testing
      .then(() => console.log("script injected"));
  });
};

injectScript();

function analyzeMessage(message, sender, sendResponse) {
  console.log(`the message is: ${message.title}; ${message.body}`);
  console.log(`the sender's tab is: ${sender.tab.tabs}`);
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(request);
// });
chrome.runtime.onMessage.addListener(analyzeMessage);

/***********************************************************************/
/*********************** tabs ************************/

const tabContainer = document.querySelector(".nav-left");
const navItems = document.querySelectorAll(".nav-item");
const tabs = document.querySelectorAll(".tab");

/*********************** nav menu tab switching ****************************/

function switchTab(e) {
  e.preventDefault();
  const clicked = e.target.closest(".nav-item");
  if (!clicked) return;

  navItems.forEach((tab) => tab.classList.remove("nav-item__active"));
  clicked.classList.add("nav-item__active");

  tabs.forEach((tab) => tab.classList.remove("tab__active"));

  document
    .getElementById(`tab__${clicked.dataset.tab}`)
    .classList.add("tab__active");
}

tabContainer.addEventListener("click", switchTab);

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(request);
// });

// TODO count amount of h1 titles, and alert if 0 or >1; return it/them
// TODO count amount of h2 titles, alert if 0; return them
// TODO count amount of h3 titles; return them
// TODO count amount of h4 titles; return them
// TODO count amount of h5 titles; return them
// TODO count amount of h6 titles; return them
// TODO get all image names, and their alt tags; return them

// TODO from <title> tag (omit common words like: 'the', 'a', 'of', 'in'), and show a list of the derived words; return them

// TODO count the occurrence of the keywords in titles, and show where it occurs
// TODO count the occurrence of keywords in body, and show where it occurs
// TODO count the occurrence of keywords, and show where it occurs
// TODO scan the occurrence of each keyword in image
// TODO count keywords in image names and alt tags

// TODO optional challenge: // instead of a single derived 'keyword' meaningful keywords, allow the user to check combinations, and dynamically count based on those preferences

/*********************** keywords tab ****************************/

const checkButton = document.querySelector("#keyword-check__submit");

// Event listeners
checkButton.addEventListener("click", checkKeyword);
document.addEventListener("DOMContentLoaded", displayInformation);

// Display all static information on all tabs
function displayInformation() {
  displayTagInfo("title");
  displayTagInfo("meta");
}

// Inserts the title and meta description in the info box on the keywords tab
function displayTagInfo(tag) {
  const tags = pageInfo[tag];
  const div = document.getElementById(`keyword-check-infobox__div-${tag}`);

  tags.forEach((el) => {
    let output = `<p class="keyword-check-infobox__body-${tag}">${el}</p>`;
    div.insertAdjacentHTML("beforeend", output);
  });
}

// reset the title and meta tag on the keyword tab
function resetTagInfo(tag) {
  const infoBoxTags = document.querySelectorAll(
    `.keyword-check-infobox__body-${tag}`
  );

  infoBoxTags.forEach((el) => el.remove());
  displayTagInfo(tag);
}

// checks the keyword in the page information object
function checkKeyword(event) {
  event.preventDefault();
  const keyword = document.querySelector("#keyword-check__input").value;

  // reset the info box with title and meta tag (removes marking)
  resetTagInfo("title");
  resetTagInfo("meta");

  // check if user has input a keyword
  if (!keyword) return;

  // store the input keyword in the doc object
  pageInfo.keyword = keyword;

  // run checks for keyword
  checkKeywordInTags(keyword, "title");
  checkKeywordInTags(keyword, "meta");
  checkKeywordInTitles(keyword);
  checkKeywordInContent(keyword);
}

// check the keyword in the infobox tags
function checkKeywordInTags(keyword, tag) {
  const regex = new RegExp(`(${keyword})` + "\\b", "gi");
  const infoBoxTags = document.querySelectorAll(
    `.keyword-check-infobox__body-${tag}`
  );

  infoBoxTags.forEach((el) => {
    let content = el.textContent;
    if (content.match(regex)) {
      el.innerHTML = content.replace(regex, "<mark>$1</mark>");
      el.classList.add("marked");
    }
  });
}

// check the keyword in titles
function checkKeywordInTitles(kw) {
  const keyword = new RegExp(`(${kw})` + "\\b", "gi");
  const contentBox = document.querySelector(
    ".section-content__keyword-in-title"
  );
  const sectionTitle = document.querySelector(
    "#section-heading__keyword-in-title"
  );

  let counter = 0;

  contentBox.innerHTML = "";

  // search for keyword in titles, and output on form
  for (let i = 1; i <= 6; i++) {
    if (pageInfo[`h${i}`] === "--none--") continue;

    pageInfo[`h${i}`].forEach((title) => {
      if (title.match(keyword)) {
        let output = `
          <div class="section-item section-item__keyword-in-title">
          <img
          src="../images/seo-extension-h${i}.svg"
          class="icon section-item-icon"
          />
          <p class="section-item-content">
          ${title}
          </p>
          </div>
          `;
        contentBox.insertAdjacentHTML("beforeend", output);
        counter++;
      }
      // TODO maybe add functionality to store these derived titles in a separate property, so they can be output in the pdf.
    });
  }
  sectionTitle.textContent = `Keyword in titles (${counter})`;
}

// check the keyword in the text on the page
function checkKeywordInContent(kw) {
  // calculate length of keyword or keyphrase
  const keyword = new RegExp(`(${kw})` + "\\b", "gi");

  const keywordLength = pageInfo.keyword.split(" ").length;

  // calculate total word count
  const wordCount = pageInfo.content?.length;

  // check for matches of keyword in content
  const keywordCount = pageInfo.content.toLowerCase().match(keyword);

  // calculate keyword density (keyword/100 words)
  let keywordDensity = 0;
  if (keywordCount) {
    const keywordCountLength = keywordCount.length;

    // calculate keyword density for single keyword
    // Density = ( Nkr / Tkn ) * 100.
    if (keywordLength === 1)
      keywordDensity = ((keywordCountLength / wordCount) * 100).toFixed(2);

    // Correction for keyphrase instead of keyword
    // Density = ( Nkr / ( Tkn -( Nkr * ( Nwp-1 ) ) ) ) * 100
    if (keywordLength > 1)
      keywordDensity = (
        (keywordCountLength /
          (wordCount - keywordCountLength * (keywordLength - 1))) *
        100
      ).toFixed(2);
  }

  pageInfo.keywordDensity = keywordDensity;

  // output results
  const keywordCountOutput = document.getElementById(
    "section-item-content__keyword-count"
  );
  const wordCountOutput = document.getElementById(
    "section-item-content__word-count"
  );
  const keywordDensityOutput = document.getElementById(
    "section-item-content__keyword-density"
  );
  keywordCountOutput.textContent = keywordCount?.length || "0";
  wordCountOutput.textContent = wordCount || "0";
  keywordDensityOutput.textContent = `${keywordDensity}%`;
}
