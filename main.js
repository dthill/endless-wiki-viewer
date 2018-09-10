//iFrame horizontal scrollbars

// MIT License
//
// Copyright (c) 2018 Damien T
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
  "format": "json",
  "prop": "extracts|pageimages",
  "generator": "random",
  "exchars": "500",
  "exlimit": "12",
  "exintro": 1,
  "explaintext": 1,
  "pithumbsize": "200",
  "pilimit": "12",
  "grnnamespace": "0",
  "grnlimit": "12",
  "origin": "*",
  "requestid": ""
};

/////////////////
//DOM Variables//
/////////////////

const randomArticles = document.getElementById("articles");
const savedArticles = document.getElementById("saved-articles");
const articleTitle = document.getElementById("article-title");
const viewerBody = document.getElementsByClassName("viewer-body")[0];
var articleContent;
const saveArticle = document.getElementById("save-article");
const removeArticle = document.getElementById("remove-article");
const closeViewer = document.getElementById("close-viewer");
var articleInReading;


/////////////////////
//Helping Functions//
/////////////////////

function toTemplate(htmlTemplate, dataObject){
  htmlTemplate = htmlTemplate.innerHTML
  Object.keys(dataObject).forEach(function(dataItem){
    itemRegExp = new RegExp("{{\\s*" + dataItem + "\\s*}}", "igm");
    htmlTemplate = htmlTemplate.replace(itemRegExp, dataObject[dataItem]);
  });
  return htmlTemplate;
}

function createAPIurl(obj){
  var result = "/w/api.php?";
  Object.keys(obj).forEach(function(queryKey){
    if(queryKey === "requestid"){
      result += "&" + queryKey + "=" + new Date().getTime();
    } else {
      result += "&" + queryKey + "=" + obj[queryKey];
    }
  });
  return result;
}

function saveToStorage(){
  localStorage.setItem("readingList", savedArticles.innerHTML);
}

function retrieveFromStorage(){
  if(localStorage.getItem("readingList")){
    savedArticles.innerHTML = localStorage.getItem("readingList");
  }
}

function getArticles(){
  var XHRExtracts = new XMLHttpRequest();
  XHRExtracts.responseType = "json";
  XHRExtracts.onprogress = function(){
    document.getElementById("loading-extracts").classList.remove("d-none");
  };
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
          var dataObj = {
            url: "https://en.wikipedia.org/api/rest_v1/page/mobile-html/" + encodeURIComponent(receivedData.query.pages[articleData]["title"]),
            title: receivedData.query.pages[articleData]["title"],
            extract: receivedData.query.pages[articleData]["extract"],
            thumbnailSource: thumb
          };
          randomArticles.insertAdjacentHTML("beforeend", toTemplate(document.getElementById("featuredArticleTemp"), dataObj));
        });
        return true;
      }
    }
  };
  XHRExtracts.onerror = function(){
    var errorMessage = "<h2 class='text-center'>";
    errorMessage += "Error Loading: Try Refreshing the Page";
    errorMessage += "</h2>";
    randomArticles.onscroll = function(){};
    randomArticles.insertAdjacentHTML("beforeend", errorMessage);
    return false;
  };
  XHRExtracts.open("GET", WIKI_URL + createAPIurl(queryJSON));
  XHRExtracts.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  XHRExtracts.send();
}

// load modal modal content
function loadModalContents(articleAnchor){
  var XHRArticleContent = new XMLHttpRequest();
  XHRArticleContent.responseType = 'document';
  XHRArticleContent.onprogress = function(){
    viewerBody.innerHTML = '<div id="article-content"><h2 class="text-center">Loading...</h2></div>';
  }
  XHRArticleContent.onload = function(){
    if (XHRArticleContent.readyState === XHRArticleContent.DONE) {
      if (XHRArticleContent.status === 200) {
        Array.from(XHRArticleContent.response.getElementsByTagName("table")).forEach(function(table){
          var tableStyles = table.getAttribute("style");
          table.setAttribute("style", "max-width: 95vw !important;" + tableStyles);
          var tableWrapper = XHRArticleContent.response.createElement("div");
          tableWrapper.setAttribute("style","overflow:scroll; max-width:95vw;")
          tableWrapper.innerHTML = table.outerHTML;
          table.parentNode.insertBefore(tableWrapper, table);
          table.remove();
        });
        viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
        articleContent = viewerBody.children[0];
        articleContent.contentDocument.write(XHRArticleContent.response.documentElement.innerHTML);
        articleContent.contentDocument.addEventListener("click", function(event){
          event.preventDefault();
          if($(event.target).closest('a').length){
            var url = $(event.target).closest('a').attr("href").replace(/^\./ , WIKI_URL +"/wiki");
            url = url.replace(/^\//, WIKI_URL + "/")
            window.open(url, "_blank");
          }
        });
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
        articleContent.dataset.arttitle = articleAnchor.dataset.title;
        var titleLink = articleAnchor.dataset.title.replace(/\s/gim, "_");
        articleTitle.innerHTML = '<a target="_blank" href="https://en.wikipedia.org/wiki/' + 
          encodeURIComponent(articleAnchor.dataset.title) + '">' + articleAnchor.dataset.title + 
          '<span class="align-text-top very-small">&#32;<i class="fas fa-external-link-alt"></i></span>' + '</a>';
      }
    }
  };
  XHRArticleContent.onerror = function(){
    articleTitle.innerHTML = "Error Loading: Try Again";
    viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
    saveArticle.classList.add("d-none");
    removeArticle.classList.add("d-none");
  };
  XHRArticleContent.open("GET", articleAnchor.getAttribute("href"));
  XHRArticleContent.send();
}

function hideViewer(){
  $("#article-viewer").collapse("hide");
  $("#main-section").collapse("show");
  if(articleInReading){
    articleInReading.scrollIntoView(true);
  }
}

function loadNext(){
  if(document.querySelector("ul .active").children[0].innerText === "Random Articles"){
    var areaToSearch = randomArticles;
  } else {
    var areaToSearch = savedArticles;
  }
  var title = articleContent.dataset.arttitle;
  if(areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling){
    var nextArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling.children[0];
    loadModalContents(nextArticle);
    window.scrollTo(0,0);
    articleContent.scrollTop = 0;
    articleContent.scrollLeft = 0;
    articleInReading = nextArticle;
    if(nextArticle.dataset.saved === "true"){
      saveArticle.classList.add("d-none");
      removeArticle.classList.remove("d-none");
    } else {
      removeArticle.classList.add("d-none");
      saveArticle.classList.remove("d-none");
    }
  } else {
    var promiseArticles = new Promise(function (resolve, reject) {
      getArticles()
      resolve();
    });
    promiseArticles.then(function(){
      var nextArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.nextElementSibling.children[0];
      loadModalContents(nextArticle);
      window.scrollTo(0,0);
      articleContent.scrollTop = 0;
      articleContent.scrollLeft = 0;
      articleInReading = nextArticle;
      if(nextArticle.dataset.saved === "true"){
        saveArticle.classList.add("d-none");
        removeArticle.classList.remove("d-none");
      } else {
        removeArticle.classList.add("d-none");
        saveArticle.classList.remove("d-none");
      }
    });
  }
}

function loadPrevious(){
  if(document.querySelector("ul .active").children[0].innerText === "Random Articles"){
    var areaToSearch = randomArticles;
  } else {
    var areaToSearch = savedArticles;
  }
  var title = articleContent.dataset.arttitle;
  if(areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.previousElementSibling){
    var previousArticle = areaToSearch.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]').parentNode.previousElementSibling.children[0];
    loadModalContents(previousArticle);
    window.scrollTo(0,0);
    articleContent.scrollTop = 0;
    articleContent.scrollLeft = 0;
    articleInReading = previousArticle;
    if(previousArticle.dataset.saved === "true"){
      saveArticle.classList.add("d-none");
      removeArticle.classList.remove("d-none");
    } else {
      removeArticle.classList.add("d-none");
      saveArticle.classList.remove("d-none");
    }
  }
}

///////////////////
//event listeners//
///////////////////

window.addEventListener("load", function(){
  getArticles();
  retrieveFromStorage();
});

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

document.getElementById("article-viewer").addEventListener("click", function(event){
  if(event.target === this){
    hideViewer();
  } 
});

randomArticles.onscroll = function(){
  if (this.clientHeight  >= (this.scrollHeight - this.scrollTop) * 0.8 ) {
      getArticles();
    }
};

//navbar links
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
    if($("#nav-button").is(":visible")){
      $('.navbar-toggler').click();
    }
});

//all clicks on main section including: opening viewer, save extract button and remove extract button
document.getElementById("main-section").addEventListener("click", function(event){
  event.preventDefault();
  if(event.target.classList.contains("save-extract")){
    event.target.parentNode.dataset.saved = "true";
    event.target.classList.add("d-none");
    event.target.nextElementSibling.classList.remove("d-none");
    savedArticles.appendChild(event.target.parentNode.parentNode.cloneNode(true));
    saveToStorage();
  } else if(event.target.classList.contains("remove-extract")){
    event.target.parentNode.dataset.saved = "false";
    var title = event.target.parentNode.dataset.title;
    var article = savedArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
        //error here first check if it exists before using it
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
  } else if(event.target.parentNode.tagName.toLowerCase() === "a"){
    loadModalContents(event.target.parentNode);
    if(event.target.parentNode.dataset.saved === "true"){
      removeArticle.classList.remove("d-none");
      saveArticle.classList.add("d-none");
    } else {
      saveArticle.classList.remove("d-none");
      removeArticle.classList.add("d-none");
    }
    $("#main-section").collapse("hide");
    $("#article-viewer").collapse("show");
  }
});

//close button
closeViewer.addEventListener("click", function(event){
  hideViewer();
})


//previouse button
document.getElementsByClassName("previous-button")[0].addEventListener("click", function(event){
  loadPrevious();
});
//next button
document.getElementsByClassName("next-button")[0].addEventListener("click", function(event){
  loadNext();
});
  



//save button in viewer
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
//remove button in viewer
removeArticle.addEventListener("click", function(event){
  var title = articleContent.dataset.arttitle;
  var article = savedArticles.querySelector('[data-title="'+ title.replace(/"/gmi, '\\"') +'"]');
    //error here fix this and close modal on click
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
// remove all button
document.getElementById("remove-all-articles").addEventListener("click", function(event){
  savedArticles.innerHTML = "";
  saveToStorage();
  $(".save-extract").removeClass("d-none");
  $(".remove-extract").addClass("d-none");
  $('[data-saved="true"]').attr("data-saved","false");
  if($("#nav-button").is(":visible")){
    $('.navbar-toggler').click();
  }
  if(document.querySelector("ul .active").children[0].innerText === "Reading List"){
    hideViewer();
  }
});

