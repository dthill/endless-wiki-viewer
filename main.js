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

function toTemplate(htmlTemplate, dataObject){
  htmlTemplate = htmlTemplate.innerHTML
  Object.keys(dataObject).forEach(function(dataItem){
    itemRegExp = new RegExp("{{\\s*" + dataItem + "\\s*}}", "igm");
    htmlTemplate = htmlTemplate.replace(itemRegExp, dataObject[dataItem]);
  });
  return htmlTemplate;
}

function randomDate(){
  var startDate = new Date(2008,0,1).getTime();
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
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight * 0.8) {
      getArticles();
    }
});

window.addEventListener("load", function(){
  getArticles();
})


// Get the modal
var modal = document.getElementById('articleModal');
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}




document.getElementById("articles").addEventListener("click", function(event){
  if(event.target = "a"){
  event.preventDefault();
    $.get(event.target.parentNode.getAttribute("href"), function(receivedData){
      document.getElementById("article-content").innerHTML = receivedData;
      document.getElementById("article-title").innerHTML = event.target.parentNode.children[1].innerHTML;
      modal.style.display = "block";
    });
  }
});

