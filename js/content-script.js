let pageInfo = {};

// TODO: activate export module when clicking export button

/****************************************************************************
/*************************** gather on-page data **************************/

//  get title or meta tag
function getTag(query, info, attr) {
  const queryRes = document.querySelectorAll(query);

  queryRes.length > 0
    ? (pageInfo[info] = Array.from(queryRes).map((t) => t[attr]))
    : (pageInfo[info] = "--none--");
}

// get h1 - h6 titles
function getTitles() {
  for (let i = 1; i <= 6; i++) {
    getTag(`h${i}`, `h${i}`, "textContent");
  }
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
  getTitles();

  // page info for images
  getImages();

  // page info for keywords (on-page text content)
  getBodyContent();
}

getPageInfo();

chrome.runtime.sendMessage(pageInfo);
