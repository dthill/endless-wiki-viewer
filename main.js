//////////////////////
//Endles Wiki Viewer//
//////////////////////
//
// MIT License
//
// Copyright (c) 2018 Damien Thill
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/////////////////////////
//API related variables//
/////////////////////////

const WIKI_URL = "https://en.wikipedia.org";

var queryJSON = {
  "action": "query",
  "format": "json", //format
  "prop": "extracts|pageimages", //properties requested
  "generator": "random", //generate list of random articles
  "exchars": "500", //number of charaters per extract
  "exlimit": "12", // number of extracts loaded
  "exintro": 1, //just provide an extract text from the first section
  "explaintext": 1, //format of returned text is plain text not html or wikitext
  "pithumbsize": "200", //size of thumbnail
  "pilimit": "12", //number of thumbnails
  "grnnamespace": "0", //only provide random articles from namespace 0 = articles
  "grnlimit": "12", //number of articles returned
  "origin": "*", //avoid CORS
  "requestid": "" //used for time-stamp to avoid caching of API requests
};

/////////////////
//DOM Variables//
/////////////////

//DIV containing all extracts received from wiki action API
const randomArticles = document.getElementById("articles");
//DIV containing all articles saved on local storage in reading list
const savedArticles = document.getElementById("saved-articles");
//title element in article viewer element
const articleTitle = document.getElementById("article-title");
//DIV containing the main part of the article viewer
const viewerBody = document.getElementsByClassName("viewer-body")[0];
//this will be the iFrame containing the article from the wiki restFull API
var articleContent;
//save button in viewer
const saveArticle = document.getElementById("save-article");
//remove button in viewer
const removeArticle = document.getElementById("remove-article");
// close button in viewer
const closeViewer = document.getElementById("close-viewer");
//article being displayed currently in the viewer used to scroll extracts into view on closing of article viewer
var articleInReading;


/////////////////////
//Helping Functions//
/////////////////////


//take data object and format it into a template to be added to the page
function toTemplate(htmlTemplate, dataObject){
  htmlTemplate = htmlTemplate.innerHTML
  Object.keys(dataObject).forEach(function(dataItem){
    itemRegExp = new RegExp("{{\\s*" + dataItem + "\\s*}}", "igm");
    htmlTemplate = htmlTemplate.replace(itemRegExp, dataObject[dataItem]);
  });
  return htmlTemplate;
}

//wrap all element in a given html document in a DIV to avoid overflow on mobile devices 
function wrapElements(htmlDOM, elementType){
  Array.from(htmlDOM.getElementsByTagName(elementType)).forEach(function(section){
          var sectionWrapper = htmlDOM.createElement("div");
          sectionWrapper.setAttribute("style","overflow:scroll; max-width:95vw;")
          sectionWrapper.innerHTML = section.outerHTML;
          section.parentNode.insertBefore(sectionWrapper, section);
          section.remove();
        });
}

//create API url from API variables
function createAPIurl(obj){
  var result = "/w/api.php?";
  Object.keys(obj).forEach(function(queryKey){
    if(queryKey === "requestid"){
      //add time-stamp to avoid caching of API requests
      result += "&" + queryKey + "=" + new Date().getTime();
    } else {
      result += "&" + queryKey + "=" + obj[queryKey];
    }
  });
  return result;
}

//save reading list to local storage
function saveToStorage(){
  localStorage.setItem("readingList", savedArticles.innerHTML);
}

//retrieve reading list from local storage
function retrieveFromStorage(){
  if(localStorage.getItem("readingList")){
    savedArticles.innerHTML = localStorage.getItem("readingList");
  }
}

//close the modal viewer
function hideViewer(){
  $("#article-viewer").collapse("hide");
  $("#main-section").collapse("show");
  //scroll article that was last read to view
  if(articleInReading){
    articleInReading.scrollIntoView({block: "center"});
  }
  //reset last article read to nothing
  articleInReading = undefined;
}

//retrieve random articles from wiki action API
function getArticles(){
  //display loading
  document.getElementById("loading-extracts").classList.remove("d-none");
  //XHR request
  var XHRExtracts = new XMLHttpRequest();
  XHRExtracts.responseType = "json";
  XHRExtracts.onload = function(){
    if (XHRExtracts.readyState === XHRExtracts.DONE) {
      if (XHRExtracts.status === 200) {
        document.getElementById("loading-extracts").classList.add("d-none");
        var receivedData = XHRExtracts.response;
        Object.keys(receivedData.query.pages).forEach(function(articleData){
          if(receivedData.query.pages[articleData].thumbnail){
            var thumb = "<img src='" + receivedData.query.pages[articleData].thumbnail.source + "'>"
          } else {
            var thumb = "";
          }
          //create data object from API response
          var dataObj = {
            url: "https://en.wikipedia.org/api/rest_v1/page/mobile-html/" + encodeURIComponent(receivedData.query.pages[articleData]["title"]),
            title: receivedData.query.pages[articleData]["title"],
            extract: receivedData.query.pages[articleData]["extract"],
            thumbnailSource: thumb
          };
          //add data object to template function to insert it into page
          randomArticles.insertAdjacentHTML("beforeend", toTemplate(document.getElementById("featuredArticleTemp"), dataObj));
        });
        return true;
      }
    }
  };
  //display error message
  XHRExtracts.onerror = function(){
    var errorMessage = "<h2 class='text-center'>";
    errorMessage += "Error Loading: Try Refreshing the Page";
    errorMessage += "</h2>";
    randomArticles.onscroll = function(){};
    randomArticles.insertAdjacentHTML("beforeend", errorMessage);
    return false;
  };
  //XHR request
  XHRExtracts.open("GET", WIKI_URL + createAPIurl(queryJSON));
  XHRExtracts.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  XHRExtracts.send();
}

// load article content from wiki restFull API - single article into vier
function loadModalContents(articleAnchor){
  //display loading text in article title
  document.getElementById("article-title").innerHTML = "Loading...";
  //create or replace existing iFrame where content for the article will be loaded
  viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
  //xhr request
  var XHRArticleContent = new XMLHttpRequest();
  XHRArticleContent.responseType = "document";
  XHRArticleContent.onload = function(){
    if (XHRArticleContent.readyState === XHRArticleContent.DONE) {
      if (XHRArticleContent.status === 200) {
        //wrap all tables of the response article document in a div to avoid overflow on small mobile devices
        wrapElements(XHRArticleContent.response, "table");
        //wrap all sections of the response article document in a div to avoid overflow on small mobile devices
        wrapElements(XHRArticleContent.response, "sections");
        //create or replace existing iFrame where content for the article will be loaded
        viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
        articleContent = viewerBody.children[0];
        //write article DOM to iFrame
        articleContent.contentDocument.write(XHRArticleContent.response.documentElement.innerHTML);
        //add event listeners for click to open all links in new windows and replace the domaine in the URL
        articleContent.contentDocument.addEventListener("click", function(event){
          event.preventDefault();
          if($(event.target).closest('a').length){
            var url = $(event.target).closest('a').attr("href").replace(/^\./ , WIKI_URL +"/wiki");
            url = url.replace(/^\//, WIKI_URL + "/")
            window.open(url, "_blank");
          }
        });
        //add functionality for esc, backspace, left aroow and right arrow
        articleContent.contentDocument.addEventListener("keydown", function(event){
          event.preventDefault();
          if(event.keyCode === 27 || event.keyCode === 8){
            hideViewer();
          } else if(event.keyCode === 37){
            loadPrevious();
          } else if(event.keyCode === 39){
            loadNext();
          }
        });
        articleContent.contentDocument.close();
        //set data-title (used later to find the same article in the extracts list)
        articleContent.dataset.arttitle = articleAnchor.dataset.title;
        //add link to article on wiki to the title (will open the original article on wiki in a new window, can be used for sharing)
        var titleLink = articleAnchor.dataset.title.replace(/\s/gim, "_");
        articleTitle.innerHTML = '<a target="_blank" href="https://en.wikipedia.org/wiki/' + 
          encodeURIComponent(articleAnchor.dataset.title) + '">' + articleAnchor.dataset.title + 
          '<span class="align-text-top very-small">&#32;<i class="fas fa-external-link-alt"></i></span>' + '</a>';
      }
    }
  };
  //display error message in article title, reset article content to empty iFrame
  XHRArticleContent.onerror = function(){
    articleTitle.innerHTML = "Error Loading: Try Again";
    viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
    saveArticle.classList.add("d-none");
    removeArticle.classList.add("d-none");
  };
  //XHR request
  XHRArticleContent.open("GET", articleAnchor.getAttribute("href"));
  XHRArticleContent.send();
}

function findArticle(previousOrNext){
  //check if user is in Random Articles or Reading list, set where the next article comes from
  if(document.querySelector("ul .active").children[0].innerText === "Random Articles"){
    var areaToSearch = randomArticles;
  } else {
    var areaToSearch = savedArticles;
  }
  var title = articleContent.dataset.arttitle;
  // find and load previous article
  if(previousOrNext === "previous"){
    var previousArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.previousElementSibling.children[0];
    loadArticleIntoViewer(previousArticle);
    //find and load next article if there is one
  } else if(previousOrNext === "next" &&
            areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling){
    var nextArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling.children[0];
    loadArticleIntoViewer(nextArticle);
    //if it is the last article and the user is in random articles get new articles and load next article into viewer
  } else if(previousOrNext === "next" && areaToSearch === randomArticles){
    //use a promise to get articles
    var promiseArticles = new Promise(function (resolve, reject) {
      getArticles()
      resolve();
    });
    //on promise complete find and then load article content into viewer
    promiseArticles.then(function(){
      var nextArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling.children[0];
      loadArticleIntoViewer(nextArticle);
    }); 
  }
}

function loadArticleIntoViewer(article){
  loadModalContents(article);
  //reset the scroll of the viewer
  window.scrollTo(0,0);
  //save which article is being read and use this later when the viewer is close to scroll this article into view in hideViewer
  articleInReading = article;
  //reset the save/remove buttons
  if(article.dataset.saved === "true"){
    saveArticle.classList.add("d-none");
    removeArticle.classList.remove("d-none");
  } else {
    removeArticle.classList.add("d-none");
    saveArticle.classList.remove("d-none");
  }
}


///////////////////
//event listeners//
///////////////////

//retrieve extracts and local storage reading list on load of window
window.addEventListener("load", function(){
  getArticles();
  retrieveFromStorage();
});

//keys functions for esc, backspace, left arrow and right arrow
window.addEventListener("keydown", function(event){
  if(event.keyCode === 27 || event.keyCode === 8){
    event.preventDefault();
    hideViewer();
  } else if(event.keyCode === 37){
    loadPrevious();
  } else if(event.keyCode === 39){
    loadNext();
  }
});

//to close the viewer: click outside article viewer on modal
document.getElementById("article-viewer").addEventListener("click", function(event){
  if(event.target === this){
    hideViewer();
  } 
});

//load article when scroll hits 75%
randomArticles.onscroll = function(){
  if (this.clientHeight  >= (this.scrollHeight - this.scrollTop) * 0.75) {
      getArticles();
    }
};

//navbar links: display random article extracts or reading list on navbar clicks
$(".nav-link").on("click", function(event){
    event.preventDefault();
    if (this.innerText === "Random Articles"){
      $(this).parent().siblings().removeClass("active");
      $(this).parent().addClass("active")
      randomArticles.classList.remove("d-none");
      savedArticles.classList.add("d-none");
      $("#main-section").collapse("show");
      $("#article-viewer").collapse("hide");
    } else if (this.innerText === "Reading List"){
      $(this).parent().siblings().removeClass("active");
      $(this).parent().addClass("active")
      savedArticles.classList.remove("d-none");
      randomArticles.classList.add("d-none");
      $("#article-viewer").collapse("hide");
      $("#main-section").collapse("show");
    }
    //collaps navbar on small screens when it is clicked
    if($("#nav-button").is(":visible")){
      $('.navbar-toggler').click();
    }
});

//all clicks on main section including: opening viewer, save extract button and remove extract button
document.getElementById("main-section").addEventListener("click", function(event){
  event.preventDefault();
  //save extract button in main section
  if(event.target.classList.contains("save-extract")){
    //set data-saved used to display correct buttons in viewer
    event.target.parentNode.dataset.saved = "true";
    event.target.classList.add("d-none");
    event.target.nextElementSibling.classList.remove("d-none");
    savedArticles.appendChild(event.target.parentNode.parentNode.cloneNode(true));
    saveToStorage();
    //remove button in main section
  } else if(event.target.classList.contains("remove-extract")){
    //set data-saved used to display correct buttons in viewer
    event.target.parentNode.dataset.saved = "false";
    var title = event.target.parentNode.dataset.title;
    //check if article is in the reading list if yes remove it
    var article = savedArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
    if(randomArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]')){
      var extract = randomArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
      extract.dataset.saved = "false";
      extract.querySelector(".remove-extract").classList.add("d-none");
      extract.querySelector(".save-extract").classList.remove("d-none");
    }
    event.target.classList.add("d-none");
    event.target.previousElementSibling.classList.remove("d-none");
    savedArticles.removeChild(article.parentNode);
    saveToStorage();
    //click on articles extracts in the main section: open article viewer 
  } else if(event.target.parentNode.tagName.toLowerCase() === "a"){
    //load article into viewer modal
    loadArticleIntoViewer(event.target.parentNode);
    //slide viewer open
    $("#main-section").collapse("hide");
    $("#article-viewer").collapse("show");
  }
});

//close button in article viewer
closeViewer.addEventListener("click", function(event){
  hideViewer();
})

//previouse article button in article viewer: load previous article
document.getElementsByClassName("previous-button")[0].addEventListener("click", function(event){
  findArticle("previous");
});

//next article button in article viewer: load next article
document.getElementsByClassName("next-button")[0].addEventListener("click", function(event){
  findArticle("next");
});
  
//save article button in article viewer: add to reading list
saveArticle.addEventListener("click", function(event){
  var title = articleContent.dataset.arttitle;
  var extract = document.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
  extract.dataset.saved = "true";
  this.classList.add("d-none");
  extract.querySelector(".save-extract").classList.add("d-none");
  extract.querySelector(".remove-extract").classList.remove("d-none");
  savedArticles.appendChild(extract.parentNode.cloneNode(true));
  removeArticle.classList.remove("d-none");
  saveToStorage();
});

//remove article button in viewer: revome from reading list
removeArticle.addEventListener("click", function(event){
  var title = articleContent.dataset.arttitle;
  var article = savedArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
  if(randomArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]')){
    var extract = randomArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
    extract.querySelector(".remove-extract").classList.add("d-none");
    extract.querySelector(".save-extract").classList.remove("d-none");
    extract.dataset.saved = "false";
  }
  savedArticles.removeChild(article.parentNode);
  saveArticle.classList.remove("d-none");
  saveToStorage();
  $("#article-viewer").collapse("hide");
  $("#main-section").collapse("show");
  this.classList.add("d-none");
});

//remove all articles button: clear reading list
document.getElementById("remove-all-articles").addEventListener("click", function(event){
  savedArticles.innerHTML = "";
  saveToStorage();
  //display all save buttons and hide all remove buttons, set data-save attributes to false for all
  $(".save-extract").removeClass("d-none");
  $(".remove-extract").addClass("d-none");
  $('[data-saved="true"]').attr("data-saved","false");
  if($("#nav-button").is(":visible")){
    $('.navbar-toggler').click();
  }
  //if on the reading list hide the viewer
  if(document.querySelector("ul .active").children[0].innerText === "Reading List"){
    hideViewer();
  }
});

