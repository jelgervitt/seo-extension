/************************************************************************************/
/********************************** content script ************************************/
/************************************************************************************/

let pageInfo = {};

//  get title or meta tag
function getTag(query, info, attr) {
  const queryRes = document.querySelectorAll(query);

  queryRes.length > 0
    ? (pageInfo[info] = Array.from(queryRes).map((t) => t[attr]))
    : (pageInfo[info] = "--none--");
}

// // get h1 - h6 titles (old version)
// function getTitles() {
//   for (let i = 1; i <= 6; i++) {
//     getTag(`h${i}`, `h${i}`, "textContent");
//   }
// }

function getHeadings() {
  pageInfo.headings = document

    // FIXME remove the first selector for production
    .querySelector(".testing-content-wrapper")
    .querySelectorAll("h1, h2, h3, h4, h5, h6");
}

// get all images on the page
function getImages() {
  const imgs = document.querySelectorAll("img");

  imgs.length > 0
    ? (pageInfo["images"] = Array.from(imgs).map((img) => {
        return { alt: img.alt, name: img.src.split("/").at(-1) };
      }))
    : (pageInfo[images] = "--none--");
}

// get entire body text content
function getBodyContent() {
  pageInfo.bodyContent = document.body.textContent;
}

function getPageInfo() {
  // page info for meta tag tab
  getTag("title", "title", "textContent");
  getTag("meta[name='description']", "meta", "content");

  // page info for titles tab
  getHeadings();

  // page info for images
  getImages();

  // page info for keywords (on-page text content)
  getBodyContent();
}

getPageInfo();

/************************************************************************************/
/********************************** popup script ************************************/
/************************************************************************************/

/********************************* nav menu tab switching *********************************/

const tabContainer = document.querySelector(".nav-left");
const navItems = document.querySelectorAll(".nav-item");
const tabs = document.querySelectorAll(".tab");

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

/************************************* meta tags tab ***************************************/

function checkTag(tag) {
  const titleEl = document.getElementById(`section-item-title__${tag}`);
  const bodyEl = document.getElementById(`section-item-body__${tag}`);
  const imgEl = document.getElementById(`icon__${tag}`);
  const theTag = pageInfo[tag];

  if (theTag === "--none--") {
    titleEl.textContent = `No ${tag} tag found`;
    imgEl.src = `../images/seo-extension-fail.svg`;
    return;
  }

  if (theTag.length === 1) {
    titleEl.textContent = `${tag[0].toUpperCase()}${tag.slice(1)} tag found`;
    bodyEl.textContent = theTag;
    imgEl.src = `../images/seo-extension-pass.svg`;
    return;
  }

  if (theTag.length > 1) {
    titleEl.textContent = `Multiple ${tag} tags found`;
    const list = document.createElement("ul");
    theTag.forEach((tag) =>
      list.insertAdjacentHTML("beforeend", `<li>${tag}</li>`)
    );
    bodyEl.insertAdjacentElement("beforeend", list);
    imgEl.src = `../images/seo-extension-alert.svg`;
    return;
  }
}

// FIXME: this needs to be added to an overall function that runs when the page is loaded
checkTag("title");
checkTag("meta");

/******************************** headings tab *********************************/

// filters the headings from pageInfo into h1, h2, and h3-h6, checks, and displays results
function checkHeadings() {
  const headings = pageInfo.headings;
  const div = document.getElementById("section-item-h-other");

  let h1 = [];
  let h2 = [];

  headings.forEach((h) => {
    if (h.nodeName === "H1") h1.push(h);
    if (h.nodeName === "H2") h2.push(h);
    if (h.nodeName !== "H1" && h.nodeName !== "H2") {
      par = `<p class="section-item-h-other__body-${h.localName}">${h.textContent}</p>`;
      div.insertAdjacentHTML("beforeend", par);
    }
  });
  parseHeadings(h1, "h1");
  parseHeadings(h2, "h2");
}

// helper function for checkHeadings, for h1 and h2 headings (checks and displays result)
function parseHeadings(arr, name) {
  const icon = document.getElementById(`icon__${name}`);
  const title = document.getElementById(`section-item-title__${name}`);
  const body = document.getElementById(`section-item-body__${name}`);
  if (arr.length === 0) {
    icon.src = `../images/seo-extension-fail.svg`;
    title.textContent = `No ${name.toUpperCase()} heading(s) found`;
  }
  if (arr.length === 1) {
    // console.log("entering the arr.length 1 for: ", name);
    icon.src = `../images/seo-extension-pass.svg`;
    title.textContent = `${name.toUpperCase()} heading(s) found`;
    element = `<li class="section-item-body__${name}-item">${arr[0].textContent}</li>`;
    body.insertAdjacentHTML("beforeend", element);
  }
  if (arr.length > 1) {
    icon.src =
      name === "h1"
        ? `../images/seo-extension-alert.svg`
        : `../images/seo-extension-pass.svg`;
    title.textContent = `${name.toUpperCase()} headings found (${arr.length})`;
    arr.forEach((el) => {
      element = `<li class="section-item-body__${name}-item">${el.textContent}</li>`;
      body.insertAdjacentHTML("beforeend", element);
    });
  }
}

// FIXME move this to an overarching function
checkHeadings();

/******************************** images tab *********************************/
// TODO get all image names, and their alt tags; return them

/*********************** keywords tab ****************************/
// TODO count the occurrence of the keywords in titles, and show where it occurs
// TODO count keywords in image names and alt tags

const checkButton = document.querySelector("#keyword-check__submit");

// Event listeners
checkButton.addEventListener("click", checkKeyword);
//NOTE: disabled during work on other tabs
// document.addEventListener("DOMContentLoaded", displayInformation);

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

    // FIXME fix this according to the new headings functionality
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
