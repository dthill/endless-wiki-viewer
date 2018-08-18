//catch api errors
//adjust number of api calls
//create cards layout
//adjust iframe height chrome hides bottom
//buttons add on mobile position
//problem with titles with special charaters querySelector title
//link to external pages not working

// var queryJSON = {
//   "action": "query",
//   "format": "json",
//   "prop": "extracts|pageimages",
//   "generator": "categorymembers",
//   "exchars": "500",
//   "exlimit": "20",
//   "exintro": 1,
//   "explaintext": 1,
//   "exsectionformat": "plain",
//   "piprop": "thumbnail",
//   "pithumbsize": "100",
//   "pilimit": "20",
//   "gcmtitle": "Category:Featured_articles",
//   "gcmprop": "ids|title|timestamp",
//   "gcmtype": "page",
//   "gcmlimit": "20",
//   "gcmsort": "timestamp",
//   "gcmdir": "older",
//   "gcmstart": "2016-01-01T12:09:31.000Z"
// };

const WIKI_URL = "https://en.wikipedia.org";

var queryJSON = {
  "action": "query",
  "format": "json",
  "prop": "extracts|pageimages",
  "generator": "random",
  "exchars": "500",
  "exlimit": "20",
  "exintro": 1,
  "explaintext": 1,
  "pithumbsize": "100",
  "pilimit": "20",
  "grnnamespace": "0",
  "grnlimit": "20"
};

var scrollPositionArticles = 0;
var scrollPositionSaved = 0;


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
      document.getElementById("articles").insertAdjacentHTML("beforeend", toTemplate(document.getElementById("featuredArticleTemp"), dataObj));
    });
  });
}

function saveToStorage(){
  localStorage.setItem("readingList", document.getElementById("saved-articles").innerHTML);
}

function retrieveFromStorage(){
  if(localStorage.getItem("readingList")){
    document.getElementById("saved-articles").innerHTML = localStorage.getItem("readingList");
  }
}

// load modal modal content
function loadModalContents(articleAnchor){
$.get(articleAnchor.getAttribute("href"), function(receivedData){
    var articleContent = document.getElementById("article-content");
    articleContent.contentDocument.write(receivedData);
    articleContent.contentDocument.addEventListener("click", function(event){
      if(event.target.getAttribute("href")){
        event.preventDefault();
        console.log(event.target.getAttribute("href"))
        window.open(event.target.getAttribute("href"), "_blank");
      } else if(event.target.parentNode.getAttribute("href")){
        window.open(event.target.parentNode.getAttribute("href"), "_blank");
      }
    });
    articleContent.contentDocument.addEventListener("keydown", function(event){
      event.preventDefault();
      if(event.keyCode === 27 || event.keyCode === 8){
            $("#myModal").modal("hide");
      }
    });
    articleContent.contentDocument.close();
    articleContent.dataset.arttitle = articleAnchor.dataset.title;
    document.getElementById("article-title").innerHTML = articleAnchor.dataset.title;
  });
}


window.addEventListener("load", function(){
  getArticles();
  retrieveFromStorage();
})

document.getElementById("articles").addEventListener("scroll", function(event){
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
      document.getElementById("articles").classList.remove("d-none");
      document.getElementById("saved-articles").classList.add("d-none");
      scrollPositionArticles = window.scrollY;
      window.scrollTo(0, scrollPositionSaved);
    } else if (this.innerText === "Reading List"){
      //retrive local storage set innerHTML to local storage  
      $(this).parent().siblings().removeClass("active");
      $(this).parent().addClass("active")
      document.getElementById("saved-articles").classList.remove("d-none");
      document.getElementById("articles").classList.add("d-none")
      scrollPositionSaved = window.scrollY;
      window.scrollTo(0, scrollPositionArticles);
    }
    
});

//fix this
//
//open modal load article content
document.getElementById("main-section").addEventListener("click", function(event){
  event.preventDefault();
  if(event.target.classList.contains("save-extract")){
    event.target.parentNode.dataset.saved = "true";
    event.target.classList.add("d-none");
    event.target.nextElementSibling.classList.remove("d-none");
    document.getElementById("saved-articles").appendChild(event.target.parentNode.parentNode.cloneNode(true));
    saveToStorage();
  } else if(event.target.classList.contains("remove-extract")){
    event.target.parentNode.dataset.saved = "false";
    var title = event.target.parentNode.dataset.title;
    var article = document.getElementById("saved-articles").querySelector("[data-title='"+ title +"']");
    var extract = document.getElementById("articles").querySelector("[data-title='"+ title +"']");
    extract.dataset.saved = "false";
    extract.querySelector(".remove-extract").classList.add("d-none");
    extract.querySelector(".save-extract").classList.remove("d-none");
    event.target.classList.add("d-none");
    event.target.previousElementSibling.classList.remove("d-none");
    document.getElementById("saved-articles").removeChild(article.parentNode);
    saveToStorage();
  } else if(event.target.parentNode.tagName.toLowerCase() === "a"){
    loadModalContents(event.target.parentNode);
    if(event.target.parentNode.dataset.saved === "true"){
      document.getElementById("remove-article").classList.remove("d-none");
      document.getElementById("save-article").classList.add("d-none");
    } else {
      document.getElementById("save-article").classList.remove("d-none");
      document.getElementById("remove-article").classList.add("d-none");
    }
    $("#myModal").modal();
  }
});

//make links open in new window


//previouse button
document.getElementsByClassName("previous-button")[0].addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.arttitle;
  if(document.querySelector("[data-title='"+ title +"']").parentNode.previousElementSibling){
    var previousArticle = document.querySelector("[data-title='"+ title +"']").parentNode.previousElementSibling.children[0];
    loadModalContents(previousArticle);
    document.getElementById("article-content").scrollTop = 0;
    document.getElementById("article-content").scrollLeft = 0;
    if(previousArticle.dataset.saved === "true"){
      document.getElementById("save-article").classList.add("d-none");
      document.getElementById("remove-article").classList.remove("d-none");
    } else {
      document.getElementById("remove-article").classList.add("d-none");
      document.getElementById("save-article").classList.remove("d-none");
    }
  }
});


//next button
document.getElementsByClassName("next-button")[0].addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.arttitle;
  if(document.querySelector("[data-title='"+ title +"']").parentNode.nextElementSibling){
    var nextArticle = document.querySelector("[data-title='"+ title +"']").parentNode.nextElementSibling.children[0];
    loadModalContents(nextArticle);
    document.getElementById("article-content").scrollTop = 0;
    document.getElementById("article-content").scrollLeft = 0;
    if(nextArticle.dataset.saved === "true"){
      document.getElementById("save-article").classList.add("d-none");
      document.getElementById("remove-article").classList.remove("d-none");
    } else {
      document.getElementById("remove-article").classList.add("d-none");
      document.getElementById("save-article").classList.remove("d-none");
    }
  }
});


document.getElementById("save-article").addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.arttitle;
  var article = document.querySelector("[data-title='"+ title +"']");
  article.dataset.saved = "true";
  this.classList.add("d-none");
  article.querySelector(".save-extract").classList.add("d-none");
  article.querySelector(".remove-extract").classList.remove("d-none");
  document.getElementById("saved-articles").appendChild(article.parentNode.cloneNode(true));
  document.getElementById("remove-article").classList.remove("d-none");
  saveToStorage();
});

document.getElementById("remove-article").addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.arttitle;
  var article = document.getElementById("saved-articles").querySelector("[data-title='"+ title +"']");
  var extract = document.getElementById("articles").querySelector("[data-title='"+ title +"']");
  extract.querySelector(".remove-extract").classList.add("d-none");
  extract.querySelector(".save-extract").classList.remove("d-none");
  extract.dataset.saved = "false";
  document.getElementById("saved-articles").removeChild(article.parentNode);
  this.classList.add("d-none");
  document.getElementById("save-article").classList.remove("d-none");
  saveToStorage();
});


document.getElementById("remove-all-articles").addEventListener("click", function(event){
  document.getElementById("saved-articles").innerHTML = "";
  saveToStorage();
  $(".save-extract").removeClass("d-none");
  $(".remove-extract").addClass("d-none");
  $('[data-saved="true"]').attr("data-saved","false"); 
});

