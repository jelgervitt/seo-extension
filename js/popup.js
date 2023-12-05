// Manifest V3 requires async functions
// get id of tab that was open before popup

let pageInfo;

const getTabId = async function () {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
};

// inject script into page that needs to be processed, then return

const injectScript = async function () {
  getTabId().then((theTab) => {
    chrome.scripting.executeScript({
      target: { tabId: theTab },
      files: ["./js/content-script.js"],
    });
  });
};

injectScript();

chrome.runtime.onMessage.addListener((message) => {
  pageInfo = message;
  displayAllInformation();
});

/**************************************** tabs *******************************************/

// Display all information in the tabs
function displayAllInformation() {
  checkTag("title", "Title tag");
  checkTag("meta", "Meta description");
  checkHeadings();
  checkImages();
  checkIntLinks("intLinks", "internal");
  displayExtLinks("extLinks", "external");
  displayTagInfo("title", "title tag");
  displayTagInfo("meta", "meta description");
  displayWordCount();
  displayImageInfo();
  displayCanonical();
}

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

/************************************* meta tags tab ***************************************/

function checkTag(tag, name) {
  const titleEl = document.getElementById(`section-item-title__${tag}`);
  const bodyEl = document.getElementById(`section-item-body__${tag}`);
  const imgEl = document.getElementById(`icon__${tag}`);
  const theTag = pageInfo[tag];

  if (theTag === "--none--") {
    titleEl.textContent = `No ${name.toLowerCase()} found`;
    imgEl.src = `../images/seo-extension-fail.svg`;
    return;
  }

  if (theTag.length === 1) {
    titleEl.textContent = `${name} found (${theTag[0].length} characters)`;
    bodyEl.textContent = theTag;
    imgEl.src = `../images/seo-extension-pass.svg`;
    return;
  }

  if (theTag.length > 1) {
    titleEl.textContent = `Multiple ${name.toLowerCase()}s found`;
    const list = document.createElement("ul");
    theTag.forEach((tag) =>
      list.insertAdjacentHTML("beforeend", `<li>${tag}</li>`)
    );
    bodyEl.insertAdjacentElement("beforeend", list);
    imgEl.src = `../images/seo-extension-alert.svg`;
    return;
  }
}

/******************************** headings tab *********************************/

// filters the headings from pageInfo into h1, h2, and h3-h6, checks, and displays results

function checkHeadings() {
  const headings = pageInfo.headings;
  const div = document.getElementById("section-item-h-other");
  let counter = 0;
  let h1 = [];
  let h2 = [];

  headings.forEach((h) => {
    if (h.nodeName === "H1") h1.push(h);
    if (h.nodeName === "H2") h2.push(h);
    if (h.nodeName !== "H1" && h.nodeName !== "H2") {
      par = `<p class="section-item-h-other__body-${h.localName}">(${h.nodeName}) ${h.textContent}</p>`;
      div.insertAdjacentHTML("beforeend", par);
      counter++;
    }
  });

  if (counter === 0) {
    par = `<h3 class="section-item-h-other__body">No other headings found</h3>`;
    div.insertAdjacentHTML("beforeend", par);
  }
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
    title.textContent = `No ${name.toUpperCase()} heading found`;
  }
  if (arr.length === 1) {
    icon.src = `../images/seo-extension-pass.svg`;
    title.textContent = `${name.toUpperCase()} heading found`;
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

/******************************** images tab *********************************/

function checkImages() {
  const imgs = pageInfo.images;
  const imgHeading = document.getElementById("section-heading__images");
  const iconImgPass = document.getElementById("icon__images-pass");
  const iconImgAlert = document.getElementById("icon__images-alert");
  const titleImgPass = document.getElementById(
    "section-item-title__images-pass"
  );
  const titleImgAlert = document.getElementById(
    "section-item-title__images-alert"
  );
  const imgSection = document.getElementById("section__image-details");

  let altPass = 0;
  let altAlert = 0;

  if (imgs === "--none--") {
    imgHeading.textContent = `Images (0)`;
    iconImgPass.src = `../images/seo-extension-fail.svg`;
    titleImgPass.textContent = "No images found";
    return;
  }

  imgs.forEach((img, index) => {
    img.alt === "" ? (altAlert += 1) : (altPass += 1);
    let element = `
      <div class="section-item" id="section-item__image-details-${index}">
      <div class="section-item-content">
        <h3
          class="section-item-title"
          id="section-item-title__image-details-${index}"
        >
          Name: ${
            img.name.length < 65 ? img.name : `${img.name.slice(0, 65)} [...]`
          }
        </h3>
        <p
          class="section-item-body"
          id="section-item-body__image-details-${index}"
        >
          ${
            img.alt
              ? `Alt text: ${img.alt}`
              : `<span class="missing-alt-tag">Alt tag missing</span>`
          }
        </p>
      </div>
    </div>
    `;
    imgSection.insertAdjacentHTML("beforeend", element);
  });

  imgHeading.textContent = `Images (${imgs.length})`;
  titleImgPass.textContent = `Images with alt tags (${altPass})`;
  iconImgPass.src = `../images/seo-extension-pass.svg`;
  titleImgAlert.textContent = `Images missing alt tags (${altAlert})`;
  iconImgAlert.src = `../images/seo-extension-alert.svg`;
}

/*********************** keywords tab ****************************/

const checkButton = document.querySelector("#keyword-check__submit");

// Event listeners

checkButton.addEventListener("click", checkKeyword);

// Inserts the title and meta description in the info box on the keywords tab, and the amount of words on the page

function displayTagInfo(tag, name) {
  const tags = pageInfo[tag];
  const div = document.getElementById(`keyword-check-infobox__div-${tag}`);

  if (tags === "--none--") {
    let output = `<p class="keyword-check-infobox__body">No ${name.toLowerCase()} found</p>`;
    div.insertAdjacentHTML("beforeend", output);
    return;
  }
  tags.forEach((el) => {
    let output = `<p class="keyword-check-infobox__body-${tag}">${el}</p>`;
    div.insertAdjacentHTML("beforeend", output);
  });
}

function displayWordCount() {
  const wordCountOutput = document.getElementById(
    "section-item-content__word-count"
  );

  const wordCount = pageInfo.bodyContent?.length
    ? pageInfo.bodyContent.split(" ").length
    : 0;

  if (wordCount) pageInfo.bodyWordCount = wordCount;

  wordCountOutput.insertAdjacentHTML(
    "beforeend",
    `<span class="keyword-content-variable">${wordCount || "0"}</span>`
  );
}

function displayImageInfo() {
  const imgs = pageInfo.images;
  const imgContainer = document.getElementById(
    "section-item-container__keyword-in-images"
  );
  const imgHeading = document.getElementById(
    "section-heading__keyword-in-images"
  );

  if (imgs === "--none--") {
    imgHeading.textContent = `Keyword in images (0)`;
    element = `
      <div class="section-item section-item__keyword-in-images">
        <p
          class="section-item-content section-item-content__keyword-in-images"
        >
          No images found on the page
        </p>
      </div>
    `;
    imgContainer.insertAdjacentHTML("beforeend", element);
  }
}

// reset the title and meta tag on the keyword tab (removes search marking)

function resetTagInfo(tag, name) {
  const infoBoxTags = document.querySelectorAll(
    `.keyword-check-infobox__body-${tag}`
  );

  infoBoxTags.forEach((el) => el.remove());
  displayTagInfo(tag, name);
}

// checks the keyword in the page information object

function checkKeyword(event) {
  event.preventDefault();
  const keyword = document.querySelector("#keyword-check__input").value;

  // reset the info box with title and meta tag (removes marking)

  resetTagInfo("title", "title tag");
  resetTagInfo("meta", "meta description");

  // check if user has input a keyword
  if (!keyword) return;

  // store the input keyword in the doc object
  pageInfo.keyword = keyword;

  // run checks for keyword
  checkKeywordInTags(keyword, "title");
  checkKeywordInTags(keyword, "meta");
  checkKeywordInTitles(keyword);
  checkKeywordInImages(keyword);
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
  const titles = pageInfo.headings;
  let counter = 0;

  contentBox.innerHTML = "";

  // search for keyword in titles, and output on form
  if (titles === "--none--") return;

  titles.forEach((title) => {
    let titleContent = title.textContent;
    if (titleContent.match(keyword)) {
      let output = `
        <div class="section-item section-item__keyword-in-title">
        <img
        src="../images/seo-extension-${title.localName}.svg"
        class="icon section-item-icon"
        />
        <p class="section-item-content">
        ${titleContent}
        </p>
        </div>
        `;
      contentBox.insertAdjacentHTML("beforeend", output);
      counter++;
    }
  });
  sectionTitle.textContent = `Keyword in titles (${counter})`;
}

// check the keyword in the text on the page
function checkKeywordInContent(kw) {
  // calculate length of keyword or keyphrase
  const keyword = new RegExp(`(${kw})` + "\\b", "gi");
  const content = pageInfo.bodyContent;
  const wordCount = pageInfo.bodyWordCount;
  const keywordLength = pageInfo.keyword.split(" ").length;
  // output results
  const keywordCountOutput = document.getElementById(
    "section-item-content__keyword-count"
  );
  const keywordDensityOutput = document.getElementById(
    "section-item-content__keyword-density"
  );
  // check for matches of keyword in content
  const keywordCount = content.toLowerCase().match(keyword);

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

  keywordCountOutput.insertAdjacentHTML(
    "beforeend",
    `<span class="keyword-content-variable" id="section-item-content__keyword-count-result">${
      keywordCount?.length || "0"
    }</span>`
  );
  keywordDensityOutput.insertAdjacentHTML(
    "beforeend",
    `<span class="keyword-content-variable" id="section-item-content__keyword-density-result">${keywordDensity}%</span>`
  );
}

function removeKeywordResults() {
  const imgContainer = document.getElementById(
    "section-item-container__keyword-in-images"
  );

  const keywordCountResult = document.getElementById(
    "section-item-content__keyword-count-result"
  );
  const keywordDensityResult = document.getElementById(
    "section-item-content__keyword-density-result"
  );
  if (keywordCountResult) keywordCountResult.remove();
  if (keywordDensityResult) keywordDensityResult.remove();

  while (imgContainer.firstChild) {
    imgContainer.removeChild(imgContainer.lastChild);
  }
}

function checkKeywordInImages(kw) {
  const keyword = new RegExp(`(${kw})` + "\\b", "gi");
  const imgs = pageInfo.images;
  const imgSection = document.getElementById("section__keyword-in-images");
  const imgHeading = document.getElementById(
    "section-heading__keyword-in-images"
  );
  const imgContainer = document.getElementById(
    "section-item-container__keyword-in-images"
  );

  let counter = 0;

  if (imgs === "--none--") return;

  removeKeywordResults();

  imgs.forEach((img) => {
    const name = img.name;
    const alt = img.alt;
    if (name.match(keyword) || alt.match(keyword)) {
      let element = `
        <div class="section-item" id="section-item__image-details-${counter}">
          <div class="section-item-content">
            <h3
              class="section-item-title"
              id="section-item-title__image-details-${counter}"
            >
              ${name}
            </h3>
            <p
              class="section-item-body"
              id="section-item-body__image-details-${counter}"
            >
              ${alt || `<span class="missing-alt-tag">Alt tag missing</span>`}
            </p>
          </div>
        </div>
        `;
      imgContainer.insertAdjacentHTML("beforeend", element);
      counter++;
    }
  });
}

/******************************** links tab *********************************/

// Checks if there are links, and whether they're broken or not

async function checkIntLinks(arr, type) {
  const links = pageInfo[arr];

  // check if the array contains any links, if not, skip
  if (links === "--none--") {
    linkTitle.textContent = `${
      type.slice(0, 1).toUpperCase() + type.slice(1)
    } links (0)`;
    element = `
        <p
          class="section-item-content section-item-content__keyword-in-images"
        >
          No ${type} links found on the page
        </p>
    `;
    linkTitle.insertAdjacentHTML("beforeend", element);
    return;
  }

  // get server response code for all links
  const linkTitle = document.getElementById(`section-heading__${type}-links`);
  const linkContainer = document.getElementById(
    `section-item-container__${type}-links`
  );
  let counter = 0;

  links.forEach(async (link) => {
    if (!link["status"]) {
      result = await fetch(link["href"], { method: "HEAD" });
      link["status"] = result.status;
      displayIntLinks(link, type, linkContainer);
      counter++;
    } else {
      displayIntLinks(link, type, linkContainer);
      counter++;
    }
    linkTitle.textContent = `${type[0].toUpperCase()}${type.slice(1)} links (${
      counter === links.length
        ? `${counter} checked links`
        : `still checking ${links.length - counter} links`
    })`;
  });
}

function displayIntLinks(link, type, linkContainer) {
  element = `
  <div class="section-item section-item-column section-item__link">
    <p class="section-item-title section-item-title__link">
    <span class="link-anchor-text">Anchor text</span> ${
      link.textContent === "" ? "no anchor text found" : link.textContent
    }
    </p>
    <p class="section-item-content section-item-content__link">
    <a href="${link.href}">${link.href}</a>
    ${
      link.status !== 200
        ? '<span class="broken-link">broken</span>'
        : '<span class="active-link">active</span>'
    }
    </p> 
</div>`;
  linkContainer.insertAdjacentHTML("beforeend", element);
}

function displayExtLinks(arr, type) {
  const links = pageInfo[arr];
  const linkTitle = document.getElementById(`section-heading__${type}-links`);
  const linkContainer = document.getElementById(
    `section-item-container__${type}-links`
  );
  let counter = 0;

  links.forEach((link) => {
    // evaluate if link is broken
    element = `
      <div class="section-item section-item-column section-item__link">
        <h3 class="section-item-title section-item-title__link">
          <span class="link-anchor-text">Anchor text:</span> ${
            link.textContent === "" ? "no anchor text found" : link.textContent
          }
        </h3>
        <p class="section-item-content section-item-content__link">
          <a href="${link.href}">${link.href}</a>
        </p>
    </div>`;
    linkContainer.insertAdjacentHTML("beforeend", element);
    counter++;
  });

  linkTitle.textContent = `${type[0].toUpperCase()}${type.slice(
    1
  )} links (${counter})`;
}

function displayCanonical() {
  const par = document.getElementById("section-item__canonical");
  const canonical = pageInfo.canonical;

  par.innerHTML =
    canonical === "--none--"
      ? `No canonical link found`
      : `The canonical link points to <a href="${canonical}">${canonical}</a>`;
}
