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

function getHeadings() {
  pageInfo.headings = document

    // FIXME remove the first selector for production
    .querySelector(".testing-content-wrapper")
    .querySelectorAll("h1, h2, h3, h4, h5, h6");
}

// get all images on the page
function getImages() {
  const imgs = document
    // FIXME remove the first selector for production
    .querySelector(".testing-content-wrapper")
    .querySelectorAll("img");

  imgs.length > 0
    ? (pageInfo["images"] = Array.from(imgs).map((img) => {
        return { alt: img.alt, name: img.src.split("/").at(-1) };
      }))
    : (pageInfo["images"] = "--none--");
}

// get entire body text content
function getBodyContent() {
  pageInfo.bodyContent = document.body.textContent;
}

// get all links
function getLinks() {
  // FIXME remove the first querySelector for production
  const links = document
    .querySelector(".testing-content-wrapper")
    .querySelectorAll("a");

  if (links?.length === 0) {
    pageInfo.extLinks = "--none--";
    pageInfo.intLinks = "--none--";
    return;
  }

  pageInfo.extLinks = [...links].filter(
    (node) => node.host !== document.location.host
  );
  pageInfo.intLinks = [...links].filter(
    (node) => node.host === document.location.host
  );
}

function getPageInfo() {
  // page info for meta tag tab (args are always: 'element name', 'property name in pageInfo', 'attribute to extract')
  getTag("title", "title", "textContent");
  getTag("meta[name='description']", "meta", "content");
  getTag("link[rel='canonical']", "canonical", "href");

  // page info for titles tab
  getHeadings();

  // page info for images
  getImages();

  // page info for keywords (on-page text content)
  getBodyContent();

  // get all hyperlinks
  getLinks();
}

getPageInfo();

/************************************************************************************/
/********************************** popup script ************************************/
/************************************************************************************/

document.addEventListener("DOMContentLoaded", displayAllInformation);

// Display all information in the tabs
function displayAllInformation() {
  checkTag("title", "Title tag");
  checkTag("meta", "Meta description");
  checkHeadings();
  checkImages();
  displayTagInfo("title");
  displayTagInfo("meta");
  displayImageInfo();
  displayLinks("intLinks", "internal");
  displayLinks("extLinks", "external");
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

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(request);
// });

/************************************* meta tags tab ***************************************/

function checkTag(tag, name) {
  const titleEl = document.getElementById(`section-item-title__${tag}`);
  const bodyEl = document.getElementById(`section-item-body__${tag}`);
  const imgEl = document.getElementById(`icon__${tag}`);
  const theTag = pageInfo[tag];

  if (theTag === "--none--") {
    titleEl.textContent = `No ${name.toLowerCase()} found`;
    imgEl.src = `../images/seo-extension-pass.svg`;
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

  let h1 = [];
  let h2 = [];

  headings.forEach((h) => {
    if (h.nodeName === "H1") h1.push(h);
    if (h.nodeName === "H2") h2.push(h);
    if (h.nodeName !== "H1" && h.nodeName !== "H2") {
      par = `<p class="section-item-h-other__body-${h.localName}">(${h.nodeName}) ${h.textContent}</p>`;
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
          ${img.name}
        </h3>
        <p
          class="section-item-body"
          id="section-item-body__image-details-${index}"
        >
          ${img.alt || `<span class="missing-alt-tag">Alt tag missing</span>`}
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

// Inserts the title and meta description in the info box on the keywords tab
function displayTagInfo(tag) {
  const tags = pageInfo[tag];
  const div = document.getElementById(`keyword-check-infobox__div-${tag}`);
  tags.forEach((el) => {
    let output = `<p class="keyword-check-infobox__body-${tag}">${el}</p>`;
    div.insertAdjacentHTML("beforeend", output);
  });
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
  checkKeywordInImages(keyword);
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
  const keywordLength = pageInfo.keyword.split(" ").length;

  // calculate total word count
  const wordCount = content?.length;

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

function removeKeywordImageResults() {
  const imgContainer = document.getElementById(
    "section-item-container__keyword-in-images"
  );
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

  removeKeywordImageResults();

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

function displayLinks(linksArr, type) {
  const links = pageInfo[linksArr];
  const linkTitle = document.getElementById(`section-heading__${type}-links`);
  const linkContainer = document.getElementById(
    `section-item-container__${type}-links`
  );
  let counter = 0;

  if (links === "--none--") {
    linkTitle.textContent = `Internal links (0)`;
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

  links.forEach((link) => {
    element = `
      <div class="section-item section-item-column section-item__link">
        <h3 class="section-item-title section-item-title__link">
          Anchor text: ${link.textContent}
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
