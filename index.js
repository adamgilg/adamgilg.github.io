// Wrap everything in an Immediately Invoked Function Expression to better namespace it
(function(root) {
  // Initialize the app when the content loads
  root.addEventListener("DOMContentLoaded", function() { initialize(); });

  var appState = {
    images: [],
    currentLightboxIndex: null,
    loading: false
  };

  function initialize() {
    bindEventListeners();
  }

  function bindEventListeners() {
    var searchOverlay = document.getElementById('search-overlay');
    var searchButton = document.getElementById('search-button');
    var searchResults = document.getElementById('search-results');
    var lightbox = document.getElementById('lightbox-background');
    var lightboxArrows = document.getElementById('arrows');
    // var lightboxRight = document.getElementById('right');
    // for real world use
    searchButton.addEventListener('click', performSearch);

    // for dev
    // searchButton.addEventListener('click', handleSearchResults.bind(undefined, JSON.stringify(sampleResult)));

    // for browserstack testing
    // handleSearchResults(JSON.stringify(sampleResult));

    // Use the parent element to handle all clicks on the child image divs
    searchResults.addEventListener('click', handleImageClick);
    // loadMoreButton.addEventListener('click', loadMoreResults);

    root.addEventListener('keydown', handleKeyboardInput);
    // searchOverlay.addEventListener('transitionend', fadeComplete);
    lightbox.addEventListener('click', handleLightboxClick);
    lightboxArrows.addEventListener('click', handleArrowClick);
    // lightbox.addEventListener('transitionend', fadeComplete);
  }

  function handleKeyboardInput(e) {
    switch (e.keyCode) {
      // enter/return to submit search
      case 13:
        // only do this if we have no images already loaded
        // and we are not currently loading images
        if (!appState.images.length && !appState.loading) {
          performSearch();
        }
      // left arrow
      case 37:
        switchLightbox('left');
        break;
      // right arrow
      case 39:
        switchLightbox('right');
        break;
      // escape
      case 27:
        toggleLightbox();
        break;
    }
  }

  function performSearch(e) {
    // check to see if search query contains any characters
    if (/\S/.test(document.getElementById('search-query').value)) {
      appState.loading = true;
      var request = new XMLHttpRequest();

      var url = buildURL();

      request.open('GET', url);
      request.onload = function() {
        if (request.status === 200) {
          handleSearchResults(request.response)
          appState.loading = false;
        } else {
          console.log('error fetching search results: ', request.status)
          appState.loading = false;
        }
      }
      request.send();
    } else {
      // if there are no characters, alert the user
      alert('Please enter search terms');
    }
  }

  function buildURL() {
    // Set up initial variables for url
    var url = 'https://www.googleapis.com/customsearch/v1?';
    var key = 'AIzaSyCCnsPFGmseJamrNwLs4-zTf2ONYJjvTzA';
    var searchEngineID = '010842445193838990140:hpytv50nw20';
    var searchQuery = document.getElementById('search-query').value;
    var startIndex = appState.images.length;

    // build out a parameters object
    var params = {
      key: key,
      cx: searchEngineID,
      q: searchQuery,
      searchType: 'image',
      imgSize: 'large',
      num: 9,
      safe: 'high'
    }

    // convert the parameters object into an array of properly encoded strings
    // then join the array itms with &s and add them to the existing url string
    url = url.concat(Object.keys(params).map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&'));

    return url;
  }

  function handleSearchResults(results) {
    // parse out the items array from the api response
    var parsedResults = JSON.parse(results).items;

    // Loop through the results and generate elements to put into the grid
    parsedResults.forEach(function(item) {
      // create the new grid element
      // pass in the length (before we push the new item) as the new item's index
      var element = generateImage(item.image.thumbnailLink, appState.images.length);
      // append it to the search-results element
      document.getElementById('search-results').appendChild(element);

      appState.images.push(item);
    });

    var searchOverlay = document.getElementById('search-overlay');
    fadeInOrOut(searchOverlay);
  }

  function fadeInOrOut(element) {
    if (element.classList.contains('show')) {
      element.classList.remove('show');
      element.classList.add('hide');
    } else if (element.classList.contains('hide')) {
      element.classList.remove('hide');
      element.classList.add('show');
    }
  }

  function generateImage(link, index) {
    var wrapper = document.createElement('div');
    wrapper.className = 'col-1-3';

    var image = document.createElement('div');
    image.className = 'img-holder';
    image.style.backgroundImage = 'url(' + link + ')';
    image.setAttribute('data-index', index);

    wrapper.appendChild(image);
    return wrapper;
  }

  function handleImageClick(e) {
    // only open the lightbox if the clicked element is one of our images
    if (e.target.className.includes('img-holder')) {
      // get the index attribute and coerce it into a number
      var imageIndex = +e.target.getAttribute('data-index');
      // make sure it's a number if we're going to open the lightbox
      if (imageIndex !== NaN) {
        setLightboxImage(imageIndex);
        toggleLightbox();
      }
    }

    e.stopPropagation();
  }

  function handleLightboxClick(e) {
    if (e.target.id !== 'lightbox-image') {
      toggleLightbox();
    }

    e.stopPropagation();
  }

  function handleArrowClick(e) {
    if (e.target.id.includes('left')) {
      switchLightbox('left');
    } else if (e.target.id.includes('right')) {
      switchLightbox('right');
    }
    e.stopPropagation();
  }

  function switchLightbox(direction) {
    if (appState.currentLightboxIndex !== null) {
      // determine whether to add or subtract from our lightbox index
      var indexChange = direction === 'left' ? -1 : 1;
      var nextImageIndex = appState.currentLightboxIndex + indexChange;

      // Only switch image if the next image is within our image array range
      if (nextImageIndex >= 0 && nextImageIndex < appState.images.length) {
        setLightboxImage(nextImageIndex);
        appState.currentLightboxIndex = nextImageIndex;
      }
    }
  }

  function setLightboxImage(imageIndex) {
    var currentImage = appState.images[imageIndex];
    var lightboxImage = document.getElementById('lightbox-image');

    lightboxImage.src = currentImage.link;
    appState.currentLightboxIndex = imageIndex;
    return true;
  }

  function toggleLightbox() {
    if (appState.currentLightboxIndex !== null) {
      var lightboxBackground = document.getElementById('lightbox-background');
      fadeInOrOut(lightboxBackground);
    }
  }

})(window);

var sampleResult =
{
 "kind": "customsearch#search",
 "url": {
  "type": "application/json",
  "template": "https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&lr={language?}&safe={safe?}&cx={cx?}&cref={cref?}&sort={sort?}&filter={filter?}&gl={gl?}&cr={cr?}&googlehost={googleHost?}&c2coff={disableCnTwTranslation?}&hq={hq?}&hl={hl?}&siteSearch={siteSearch?}&siteSearchFilter={siteSearchFilter?}&exactTerms={exactTerms?}&excludeTerms={excludeTerms?}&linkSite={linkSite?}&orTerms={orTerms?}&relatedSite={relatedSite?}&dateRestrict={dateRestrict?}&lowRange={lowRange?}&highRange={highRange?}&searchType={searchType}&fileType={fileType?}&rights={rights?}&imgSize={imgSize?}&imgType={imgType?}&imgColorType={imgColorType?}&imgDominantColor={imgDominantColor?}&alt=json"
 },
 "queries": {
  "request": [
   {
    "title": "Google Custom Search - hello",
    "totalResults": "1210000000",
    "searchTerms": "hello",
    "count": 9,
    "startIndex": 1,
    "inputEncoding": "utf8",
    "outputEncoding": "utf8",
    "safe": "high",
    "cx": "010842445193838990140:hpytv50nw20",
    "searchType": "image",
    "imgSize": "medium"
   }
  ],
  "nextPage": [
   {
    "title": "Google Custom Search - hello",
    "totalResults": "1210000000",
    "searchTerms": "hello",
    "count": 9,
    "startIndex": 10,
    "inputEncoding": "utf8",
    "outputEncoding": "utf8",
    "safe": "high",
    "cx": "010842445193838990140:hpytv50nw20",
    "searchType": "image",
    "imgSize": "medium"
   }
  ]
 },
 "context": {
  "title": "Google"
 },
 "searchInformation": {
  "searchTime": 0.230442,
  "formattedSearchTime": "0.23",
  "totalResults": "1210000000",
  "formattedTotalResults": "1,210,000,000"
 },
 "items": [
  {
   "kind": "customsearch#result",
   "title": "Hello Design - Wikipedia, the free encyclopedia",
   "htmlTitle": "\u003cb\u003eHello\u003c/b\u003e Design - Wikipedia, the free encyclopedia",
   "link": "https://upload.wikimedia.org/wikipedia/en/6/65/Hello_logo_sm.gif",
   "displayLink": "en.wikipedia.org",
   "snippet": "Hello logo sm.gif",
   "htmlSnippet": "\u003cb\u003eHello\u003c/b\u003e logo sm.gif",
   "mime": "image/gif",
   "fileFormat": "Image Document",
   "image": {
    "contextLink": "https://en.wikipedia.org/wiki/Hello_Design",
    "height": 300,
    "width": 300,
    "byteSize": 1842,
    "thumbnailLink": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQgawf9OdDtbP42oB6iGfdwU9-D4XQJh_dCQkSeN3J20RSPHfHosBW_QuU",
    "thumbnailHeight": 116,
    "thumbnailWidth": 116
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Image - Animated-Hello.gif - 90210 Wiki - Wikia",
   "htmlTitle": "Image - Animated-\u003cb\u003eHello\u003c/b\u003e.gif - 90210 Wiki - Wikia",
   "link": "http://vignette3.wikia.nocookie.net/90210/images/0/09/Animated-Hello.gif/revision/latest?cb=20111220172524",
   "displayLink": "90210.wikia.com",
   "snippet": "File history",
   "htmlSnippet": "File history",
   "mime": "image/",
   "fileFormat": "Image Document",
   "image": {
    "contextLink": "http://90210.wikia.com/wiki/File:Animated-Hello.gif",
    "height": 153,
    "width": 400,
    "byteSize": 32768,
    "thumbnailLink": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQH7ekEnGYGCJBxi6BX_N2mdqLoVPnCXo0qMxsWxUBQa_c784YMUbsyzm0",
    "thumbnailHeight": 47,
    "thumbnailWidth": 124
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Hello Wood on Vimeo",
   "htmlTitle": "\u003cb\u003eHello\u003c/b\u003e Wood on Vimeo",
   "link": "https://i.vimeocdn.com/portrait/10260383_300x300.jpg",
   "displayLink": "vimeo.com",
   "snippet": "Profile picture for Hello Wood",
   "htmlSnippet": "Profile picture for \u003cb\u003eHello\u003c/b\u003e Wood",
   "mime": "image/jpeg",
   "image": {
    "contextLink": "https://vimeo.com/hellowood",
    "height": 300,
    "width": 300,
    "byteSize": 7597,
    "thumbnailLink": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTzsXfCwteM_fhuKBuMSbAFPj6Y-HYT8Pi6urD78iL6uQI3n-yETfbZ5AM",
    "thumbnailHeight": 116,
    "thumbnailWidth": 116
   }
  },
  {
   "kind": "customsearch#result",
   "title": "HELLO! Online: celebrity & royal news, magazine, babies, weddings ...",
   "htmlTitle": "\u003cb\u003eHELLO\u003c/b\u003e! Online: celebrity &amp; royal news, magazine, babies, weddings \u003cb\u003e...\u003c/b\u003e",
   "link": "http://www.himgs.com/imagenes/hello/social/hello-logo-facebook.jpg",
   "displayLink": "www.hellomagazine.com",
   "snippet": "HELLO!",
   "htmlSnippet": "\u003cb\u003eHELLO\u003c/b\u003e!",
   "mime": "image/jpeg",
   "image": {
    "contextLink": "http://www.hellomagazine.com/",
    "height": 128,
    "width": 128,
    "byteSize": 5687,
    "thumbnailLink": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQspmHkmWHmdTfM4ODIsN1VypiZBJ-BRmA2xPZE9YYANNEhxVFzAOT2KLs",
    "thumbnailHeight": 91,
    "thumbnailWidth": 91
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Hello Friends",
   "htmlTitle": "\u003cb\u003eHello\u003c/b\u003e Friends",
   "link": "http://www.covchurch.org/wp-content/uploads/sites/18/2013/01/Hello-Friends-logo-300x209.png",
   "displayLink": "www.covchurch.org",
   "snippet": "Hello Friends",
   "htmlSnippet": "\u003cb\u003eHello\u003c/b\u003e Friends",
   "mime": "image/png",
   "fileFormat": "Image Document",
   "image": {
    "contextLink": "http://www.covchurch.org/children/hello-friends/",
    "height": 209,
    "width": 300,
    "byteSize": 52429,
    "thumbnailLink": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf2PbYELUxn3560dcgrFnm29uze-WVm0gtje-uX2FPUPtiV-aUO40XsQ0",
    "thumbnailHeight": 81,
    "thumbnailWidth": 116
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Hello (Adele song) - Wikipedia, the free encyclopedia",
   "htmlTitle": "\u003cb\u003eHello\u003c/b\u003e (Adele song) - Wikipedia, the free encyclopedia",
   "link": "https://upload.wikimedia.org/wikipedia/en/8/85/Adele_-_Hello_(Official_Single_Cover).png",
   "displayLink": "en.wikipedia.org",
   "snippet": "\"Hello\"",
   "htmlSnippet": "&quot;\u003cb\u003eHello\u003c/b\u003e&quot;",
   "mime": "image/png",
   "fileFormat": "Image Document",
   "image": {
    "contextLink": "https://en.wikipedia.org/wiki/Hello_(Adele_song)",
    "height": 300,
    "width": 300,
    "byteSize": 33698,
    "thumbnailLink": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcT0CZ04oCeUDWHZv4Rr93ineQBgAe5dDcIthzt2ELH6cdCVy2HOvEX8cw",
    "thumbnailHeight": 116,
    "thumbnailWidth": 116
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Just Say Hello with a wave or a",
   "htmlTitle": "Just Say \u003cb\u003eHello\u003c/b\u003e with a wave or a",
   "link": "http://andreakihlstedt.com/wpsys/wp-content/uploads/2014/04/Say-Hello1.jpg",
   "displayLink": "www.datehookup.com",
   "snippet": "Hickory, NC 77, joined Jan.",
   "htmlSnippet": "Hickory, NC 77, joined Jan.",
   "mime": "image/jpeg",
   "image": {
    "contextLink": "http://www.datehookup.com/Thread-602779-3301.htm",
    "height": 234,
    "width": 363,
    "byteSize": 19328,
    "thumbnailLink": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQBIb3dyY0Z-zVxaVZuNmyYbFs1GXgvfVvLlnPpy0SkZ44XHqGCCNZEzdw",
    "thumbnailHeight": 78,
    "thumbnailWidth": 121
   }
  },
  {
   "kind": "customsearch#result",
   "title": "HELLO! Online: celebrity & royal news, magazine, babies, weddings ...",
   "htmlTitle": "\u003cb\u003eHELLO\u003c/b\u003e! Online: celebrity &amp; royal news, magazine, babies, weddings \u003cb\u003e...\u003c/b\u003e",
   "link": "http://www.himgs.com/imagenes/hello-fashion/2015/logo-fashion.svg",
   "displayLink": "www.hellomagazine.com",
   "snippet": "Go to ¡HELLO! Fashion",
   "htmlSnippet": "Go to ¡\u003cb\u003eHELLO\u003c/b\u003e! Fashion",
   "mime": "image/svg+xml",
   "image": {
    "contextLink": "http://www.hellomagazine.com/",
    "height": 76,
    "width": 338,
    "byteSize": 5911,
    "thumbnailLink": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcS18WOfK81mp-myt30AEgwaelca5tb-JlGryeXm_IwY9xLM_P14ME1OXrg",
    "thumbnailHeight": 27,
    "thumbnailWidth": 119
   }
  },
  {
   "kind": "customsearch#result",
   "title": "Hello Forty Plus (Perth) - Meetup",
   "htmlTitle": "\u003cb\u003eHello\u003c/b\u003e Forty Plus (Perth) - Meetup",
   "link": "http://photos3.meetupstatic.com/photos/event/2/1/0/3/global_436988451.jpeg",
   "displayLink": "www.meetup.com",
   "snippet": "Hello Forty Plus",
   "htmlSnippet": "\u003cb\u003eHello\u003c/b\u003e Forty Plus",
   "mime": "image/jpeg",
   "image": {
    "contextLink": "http://www.meetup.com/Hello-Forty-Plus/",
    "height": 180,
    "width": 170,
    "byteSize": 12774,
    "thumbnailLink": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcS1tpnIvb91QNBSHEuYBsF_YAvO1U_z9Ddx_VGyXw-d2b6oOQxngb6vweQ",
    "thumbnailHeight": 101,
    "thumbnailWidth": 95
   }
  }
 ]
}
