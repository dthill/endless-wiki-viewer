const WIKI_URL = "https://en.wikipedia.org";
var requestRandomArticles = "https://en.wikipedia.org/w/api.php?&action=query&format=json&prop=extracts%7Cpageimages&list=&continue=gcmcontinue%7C%7C&generator=categorymembers&exchars=500&exlimit=20&exintro=1&explaintext=1&exsectionformat=plain&piprop=thumbnail&pithumbsize=150&pilimit=20&gcmtitle=Category%3AFeatured_articles&gcmprop=ids%7Ctitle%7Ctimestamp&gcmtype=page&gcmcontinue=2015-12-19%2023%3A10%3A09%7C7875665&gcmlimit=20&gcmsort=timestamp&gcmdir=older&gcmstart=2016-01-01T12%3A09%3A31.000Z";

var queryJSON = {
  "action": "query",
  "format": "json",
  "prop": "extracts|pageimages",
  "generator": "categorymembers",
  "exchars": "500",
  "exlimit": "20",
  "exintro": 1,
  "explaintext": 1,
  "exsectionformat": "plain",
  "piprop": "thumbnail",
  "pithumbsize": "100",
  "pilimit": "20",
  "gcmtitle": "Category:Featured_articles",
  "gcmprop": "ids|title|timestamp",
  "gcmtype": "page",
  "gcmlimit": "20",
  "gcmsort": "timestamp",
  "gcmdir": "older",
  "gcmstart": "2016-01-01T12:09:31.000Z"
};

// var queryJSON = {
//   "action": "query",
//   "format": "json",
//   "prop": "extracts|pageimages",
//   "generator": "random",
//   "exchars": "500",
//   "exlimit": "20",
//   "exintro": 1,
//   "explaintext": 1,
//   "pithumbsize": "100",
//   "pilimit": "20",
//   "grnnamespace": "0",
//   "grnlimit": "20"
// };

function toTemplate(htmlTemplate, dataObject){
  htmlTemplate = htmlTemplate.innerHTML
  Object.keys(dataObject).forEach(function(dataItem){
    itemRegExp = new RegExp("{{\\s*" + dataItem + "\\s*}}", "igm");
    htmlTemplate = htmlTemplate.replace(itemRegExp, dataObject[dataItem]);
  });
  return htmlTemplate;
}

function randomDate(){
  var startDate = new Date(2012,0,1).getTime();
  var endDate = new Date().getTime();
  //return year + "-" + month + "-" + day + "T12:09:31.000Z"; 
  return new Date(Math.floor(Math.random() * (endDate - startDate)) + startDate).toISOString();
}

function createAPIurl(obj){
  var result = "/w/api.php?"
  var ranDate = randomDate()
  Object.keys(obj).forEach(function(queryKey){
    if(queryKey === "gcmstart"){
      result += "&" + queryKey + "=" + ranDate;
    } else {
      result += "&" + queryKey + "=" + obj[queryKey];
    }
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
        url: "https://en.wikipedia.org/api/rest_v1/page/html/" + receivedData.query.pages[articleData]["title"],
        title: receivedData.query.pages[articleData]["title"],
        extract: receivedData.query.pages[articleData]["extract"],
        thumbnailSource: thumb
      };
      document.getElementById("articles").insertAdjacentHTML("beforeend", toTemplate(document.getElementById("featuredArticleTemp"), dataObj));
    });
  });
}


document.addEventListener("scroll", function(event){
  //prop scrollheight on window and compare with document.offsetHeight
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight * 0.9) {
      getArticles();
    }
});

window.addEventListener("load", function(){
  getArticles();
})

//catch api errors
//adjust number of api calls
//css for article hidden bottom horizontal scroll


//open modal load article content
document.getElementById("articles").addEventListener("click", function(event){
  if(event.target = "a"){
  event.preventDefault();
  loadModalContents(event.target.parentNode);
  openModal();
  }
});



//modal
function loadModalContents(articleAnchor){
$.get(articleAnchor.getAttribute("href"), function(receivedData){
    document.getElementById("article-content").innerHTML = receivedData;
    document.getElementById("article-content").dataset.title = articleAnchor.dataset.title;
    document.getElementById("article-title").innerHTML = articleAnchor.dataset.title;
  });
}

var scrollPosition = 0;

function toggleModal() {
  document.getElementsByClassName("modal")[0].classList.toggle("show-modal");
  document.getElementById("article-content").scrollTop = 0;
  document.getElementById("article-content").scrollLeft = 0;
}

function openModal(){
  scrollPosition = window.scrollY;
  toggleModal();
}

function closeModal(){
  window.scrollTo(0,scrollPosition);
  toggleModal();
}

document.getElementsByClassName("close-button")[0].addEventListener("click", closeModal);

window.addEventListener("click", function(event) {
    if (event.target === document.getElementsByClassName("modal")[0]) {
        closeModal();
    }
});

document.getElementsByClassName("modal")[0].addEventListener("click", function(event){
  event.preventDefault();
  if(event.target.getAttribute("href")){
    window.open(event.target.getAttribute("href"), "_blank");
  } else if(event.target.parentNode.getAttribute("href")){
    window.open(event.target.parentNode.getAttribute("href"), "_blank");
  }
});

document.addEventListener("keydown", function(event){
    if (event.keyCode == 27) {
        closeModal();
    }
});

document.getElementsByClassName("previous-button")[0].addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.title;
  if(document.querySelector("[data-title='"+ title +"']").parentNode.previousElementSibling){
    var previousArticle = document.querySelector("[data-title='"+ title +"']").parentNode.previousElementSibling.children[0];
    loadModalContents(previousArticle);
    document.getElementById("article-content").scrollTop = 0;
    document.getElementById("article-content").scrollLeft = 0;
  }
});

document.getElementsByClassName("next-button")[0].addEventListener("click", function(event){
  var title = document.getElementById("article-content").dataset.title;
  if(document.querySelector("[data-title='"+ title +"']").parentNode.nextElementSibling){
    var nextArticle = document.querySelector("[data-title='"+ title +"']").parentNode.nextElementSibling.children[0];
    loadModalContents(nextArticle);
    document.getElementById("article-content").scrollTop = 0;
    document.getElementById("article-content").scrollLeft = 0;
  }
});

//menu
function myFunction() {
    var x = document.getElementById("demo");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else { 
        x.className = x.className.replace(" w3-show", "");
    }
}