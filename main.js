//catch api errors for extract retrival
//create cards layout?
//add loaing icon
//iFrame overflow on the side
//fix next and previous buttons in savedArticles

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
  "grnlimit": "12"
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


function toTemplate(htmlTemplate, dataObject){
  htmlTemplate = htmlTemplate.innerHTML
  Object.keys(dataObject).forEach(function(dataItem){
    itemRegExp = new RegExp("{{\\s*" + dataItem + "\\s*}}", "igm");
    htmlTemplate = htmlTemplate.replace(itemRegExp, dataObject[dataItem]);
  });
  return htmlTemplate;
}



/////////////////////
//Helping Functions//
/////////////////////

function createAPIurl(obj){
  var result = "/w/api.php?";
  Object.keys(obj).forEach(function(queryKey){
    result += "&" + queryKey + "=" + obj[queryKey];
  });
  return result;
}

function getArticles(){
  $.getJSON(WIKI_URL + createAPIurl(queryJSON) + "&callback=?", function(receivedData){
    Object.keys(receivedData.query.pages).forEach(function(articleData){
      if(receivedData.query.pages[articleData].thumbnail){
        var thumb = "<img src='" + receivedData.query.pages[articleData].thumbnail.source + "'>"
      } else {
        var thumb = "";
      }
      var dataObj = {
        url: "https://en.wikipedia.org/api/rest_v1/page/mobile-html/" + receivedData.query.pages[articleData]["title"],
        title: receivedData.query.pages[articleData]["title"],
        extract: receivedData.query.pages[articleData]["extract"],
        thumbnailSource: thumb
      };
      randomArticles.insertAdjacentHTML("beforeend", toTemplate(document.getElementById("featuredArticleTemp"), dataObj));
    });
  });
}

function saveToStorage(){
  localStorage.setItem("readingList", savedArticles.innerHTML);
}

function retrieveFromStorage(){
  if(localStorage.getItem("readingList")){
    savedArticles.innerHTML = localStorage.getItem("readingList");
  }
}

// load modal modal content
function loadModalContents(articleAnchor){
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'document';
  xhr.onload = function(){
    if (xhr.readyState === xhr.DONE) {
      if (xhr.status === 200) {
          //loop through all the table elements in the received HTML and change the max-width
          Array.from(xhr.response.getElementsByTagName("table")).forEach(function(table){
          table.setAttribute("style", "max-width: 90vw !important;");
          //console.log(table);
        });
        viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
        articleContent = viewerBody.children[0];
        articleContent.contentDocument.write(xhr.response.documentElement.innerHTML);
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
                $("#article-viewer").collapse("hide");
                $("#main-section").collapse("show");
          }
        });
        articleContent.contentDocument.close();
        articleContent.dataset.arttitle = articleAnchor.dataset.title;
        articleTitle.innerHTML = articleAnchor.dataset.title;
      }
    }
  };
  xhr.onerror = function(){
    console.log(xhr)
    articleTitle.innerHTML = "Error Loading: " + xhr.status + " " + xhr.statusText + " Try Again";
    viewerBody.innerHTML = '<iframe id="article-content"></iframe>';
    saveArticle.classList.add("d-none");
    removeArticle.classList.add("d-none");
  };
  xhr.open('GET', articleAnchor.getAttribute("href"));
  xhr.send();
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
    $("#article-viewer").collapse("hide");
    $("#main-section").collapse("show");
  }
});

document.getElementById("article-viewer").addEventListener("click", function(event){
  if(event.target === this){
    $("#article-viewer").collapse("hide");
    $("#main-section").collapse("show");
  }
});

randomArticles.addEventListener("scroll", function(event){
  if (this.clientHeight  >= (this.scrollHeight - this.scrollTop) * 0.8 ) {
      getArticles();
    }
});

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
    $('.navbar-toggler').click();
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
    var article = savedArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']");
        //error here first check if it exists before using it
    if(randomArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']")){
      var extract = randomArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']");
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
  $("#article-viewer").collapse("hide");
  $("#main-section").collapse("show");
})


//previouse button
document.getElementsByClassName("previous-button")[0].addEventListener("click", function(event){
  if(document.querySelector("ul .active").children[0].innerText === "Random Articles"){
    var areaToSearch = randomArticles;
  } else {
    var areaToSearch = savedArticles;
  }
  var title = articleContent.dataset.arttitle;
  if(document.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']").parentNode.previousElementSibling){
    var previousArticle = areaToSearch.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']").parentNode.previousElementSibling.children[0];
    loadModalContents(previousArticle);
    articleContent.scrollTop = 0;
    articleContent.scrollLeft = 0;
    if(previousArticle.dataset.saved === "true"){
      saveArticle.classList.add("d-none");
      removeArticle.classList.remove("d-none");
    } else {
      removeArticle.classList.add("d-none");
      saveArticle.classList.remove("d-none");
    }
  }
});
//next button
document.getElementsByClassName("next-button")[0].addEventListener("click", function(event){
  if(document.querySelector("ul .active").children[0].innerText === "Random Articles"){
    var areaToSearch = randomArticles;
  } else {
    var areaToSearch = savedArticles;
  }
  var title = articleContent.dataset.arttitle;
  if(document.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']").parentNode.nextElementSibling){
    var nextArticle = areaToSearch.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']").parentNode.nextElementSibling.children[0];
    loadModalContents(nextArticle);
    articleContent.scrollTop = 0;
    articleContent.scrollLeft = 0;
    if(nextArticle.dataset.saved === "true"){
      saveArticle.classList.add("d-none");
      removeArticle.classList.remove("d-none");
    } else {
      removeArticle.classList.add("d-none");
      saveArticle.classList.remove("d-none");
    }
  }
});



//save button in viewer
saveArticle.addEventListener("click", function(event){
  var title = articleContent.dataset.arttitle;
  var extract = document.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']");
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
  var article = savedArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']");
    //error here fix this and close modal on click
  if(randomArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']")){
    var extract = randomArticles.querySelector("[data-title='"+ title.replace(/'/gmi, "\'") +"']");
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
  $('.navbar-toggler').click();
});

