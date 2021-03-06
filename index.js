(function(root) {
  // Initialize the app when the content loads
  root.addEventListener("DOMContentLoaded", function() { bindEventListeners() });

  var appState = {
    images: [],
    currentLightboxIndex: null,
    loading: false
  };

  function bindEventListeners() {
    var searchOverlay = document.getElementById('search-overlay');
    var searchButton = document.getElementById('search-button');
    var searchResults = document.getElementById('search-results');
    var lightbox = document.getElementById('lightbox-background');
    var lightboxArrows = document.getElementById('arrows');

    // do the actual search
    searchButton.addEventListener('click', performSearch);

    // Use the parent element to handle all clicks on the child image divs
    searchResults.addEventListener('click', handleImageClick);

    root.addEventListener('keydown', handleKeyboardInput);
    lightbox.addEventListener('click', closeLightbox);
    lightboxArrows.addEventListener('click', handleArrowClick);
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
        pageImage('left');
        break;
      // right arrow
      case 39:
        pageImage('right');
        break;
      // escape
      case 27:
        if (appState.currentLightboxIndex !== null) {
          closeLightbox();
        }
        break;
      default:
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
    var searchOverlay = document.getElementById('search-overlay');
    var searchResults = document.getElementById('search-results');
    // container for the elements we will create
    var fragment = document.createDocumentFragment();

    // Loop through the results and generate elements to put into the grid
    parsedResults.forEach(function(item) {
      // create the new grid element
      // pass in the length (before we push the new item) as the new item's index
      var element = generateImage(item.image.thumbnailLink, appState.images.length);
      // add it to the fragment created above
      fragment.appendChild(element);

      appState.images.push(item);
    });

    // Add the container to the DOM
    searchResults.appendChild(fragment);
    fadeInOrOut(searchOverlay);
  }

  function fadeInOrOut(element) {
    var classList = element.classList;
    if (classList.contains('show')) {
      classList.remove('show');
      classList.add('hide');
    } else if (classList.contains('hide')) {
      classList.remove('hide');
      classList.add('show');
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
    e.stopPropagation();

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
  }

  function closeLightbox(e) {
    // Not always called from an event handler, so check for e
    if (e) {
      e.stopPropagation();
    }

    // and check to make sure the click doesn't come from the image
    if (!e || e.target.id !== 'lightbox-image') {
      toggleLightbox();
      // Only do this after the lightbox fade transition has completed
      // TODO: change to transitionend event
      var lightboxBackground = document.getElementById('lightbox-background');
      lightboxBackground.addEventListener('transitionend', removeLightboxImage);
    }
  }

  function handleArrowClick(e) {
    e.stopPropagation();

    if (e.target.id.includes('left')) {
      pageImage('left');
    } else if (e.target.id.includes('right')) {
      pageImage('right');
    }
  }

  function pageImage(direction) {
    // sanity check
    if (appState.currentLightboxIndex === null) return;

    // determine whether to add or subtract from our lightbox index
    var indexChange = direction === 'left' ? -1 : 1;
    var nextImageIndex = appState.currentLightboxIndex + indexChange;

    // Only switch image if the next image is within our image array range
    if (nextImageIndex >= 0 && nextImageIndex < appState.images.length) {
      setLightboxImage(nextImageIndex);
    }
  }

  function setLightboxImage(imageIndex) {
    var currentImage = appState.images[imageIndex];
    var lightboxImage = document.getElementById('lightbox-image');

    lightboxImage.src = currentImage.link;

    lightboxImage.onload = function() {
      lightboxImage.classList.remove('placeholder');
    }
    appState.currentLightboxIndex = imageIndex;
  }

  function removeLightboxImage() {
    var lightboxImage = document.getElementById('lightbox-image');
    var lightboxBackground = document.getElementById('lightbox-background');
    lightboxImage.src = '';
    lightboxImage.classList.add('placeholder');
    appState.currentLightboxIndex = null;

    lightboxBackground.removeEventListener('transitionend', removeLightboxImage);
  }

  function toggleLightbox() {
    if (appState.currentLightboxIndex !== null) {
      var lightboxBackground = document.getElementById('lightbox-background');
      fadeInOrOut(lightboxBackground);
    }
  }

})(window);
