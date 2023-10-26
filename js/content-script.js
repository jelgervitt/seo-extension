if (typeof pageInfo === "undefined") {
  pageInfo = {};
}

// let pageInfo = {};

//  get title or meta tag
function getTag(query, info, attr) {
  const queryRes = document.querySelectorAll(query);

  queryRes.length > 0
    ? (pageInfo[info] = Array.from(queryRes).map((t) => t[attr]))
    : (pageInfo[info] = "--none--");
}

function getHeadings() {
  pageInfo.headings = [
    ...document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ].map((heading) => {
    return {
      nodeName: heading.nodeName,
      localName: heading.localName,
      textContent: heading.textContent,
    };
  });
}

// get all images on the page
function getImages() {
  const imgs = document.querySelectorAll("img");

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
  const links = document.querySelectorAll("a");

  if (links?.length === 0) {
    pageInfo.extLinks = "--none--";
    pageInfo.intLinks = "--none--";
    return;
  }

  pageInfo.extLinks = [...links]
    .filter((node) => node.host !== document.location.host)
    .map((link) => {
      return { textContent: link.textContent, href: link.href };
    });
  pageInfo.intLinks = [...links]
    .filter((node) => node.host === document.location.host)
    .map((link) => {
      return { textContent: link.innerText, href: link.href };
    });
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

chrome.runtime.sendMessage(pageInfo);
