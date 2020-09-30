/* 
Handles API calls, search function, dropdown menus
*/

// API Keys and details
const rapidapiKey = "a88a341c7cmshfc510aa8fcdb9dap135447jsnd9fd626021f4";
const rapidapiHost = "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com";

// Sets event listeners for place input and search
const origin = document.querySelector('.from-search');
const destination = document.querySelector('.to-search');
const ddate = document.querySelector('.departure');
const searchbutton = document.querySelector('.search-button');

//origin.addEventListener("keyup", fetchPlaces(origin.value, originStore, origin));
let timeout;
origin.addEventListener("keyup", e => {
    clearTimeout(timeout);
    timeout = setTimeout(fetchOrigin, 500, e);
});
destination.addEventListener("keyup", e => {
    clearTimeout(timeout);
    timeout = setTimeout(fetchDestination, 500, e);
});
searchbutton.addEventListener("click", queryFlights);

// Gets the dropdown elements
const fdrop = document.querySelector('.from-dropdown');
const tdrop = document.querySelector('.to-dropdown');
let originStore = new Map();
let destStore = new Map();
// For determining whether or not a dropdown value should be used
var originClicked = false;
var destClicked = false;
var originCode;
var destCode;
var countryID;

// helpers to call fetchPlaces from eventlisteners
function fetchOrigin(e) {
    let backspace = (e.keyCode === 8);
    fetchPlaces(origin.value, originStore, backspace, fdrop);
    setTimeout(createDropdown, 1000, originStore, fdrop);
}
function fetchDestination(e) {
    let backspace = (e.keyCode === 8);
    fetchPlaces(destination.value, destStore, backspace, tdrop);
    setTimeout(createDropdown, 1000, destStore, tdrop);
}

// creates a loading message for dropdown
function loadingMessage(obj) {
    obj.textContent = "";
    let message = document.createElement("li");
    message.textContent = "loading...";
    obj.appendChild(message);
}

// Based on user input fetches places for both origin and destination and creates
// dropdown
function fetchPlaces(place, placeStore, backspace, obj) {
    //console.log("fetchPlace");
    if (backspace) {
        originClicked = false;
        destClicked = false;
    }
    if (place.length < 3) {
        //console.log("<3");
        // empty storage
        placeStore.clear();
    } else if ((place.length >= 3) && (placeStore.size > 0)) {
        console.log(">3");
        loadingMessage(obj);
        if (!backspace) {
            // filter the storage by matching to place
            let placenames = placeStore.keys();
            for (name of placenames) {
                if (!name.toLowerCase().startsWith(place.toLowerCase())) {
                    //console.log("Deleted: " + name);
                    placeStore.delete(name);
                }
            }
        } else {
            // handles case when backspace is pressed and we should requery but then 
            // narrow down by the input for a more uniform UX
            console.log("backspace");
            queryPlaces(place, placeStore);
            let placenames = placeStore.keys();
            for (name of placenames) {
                if (!name.toLowerCase().startsWith(place.toLowerCase())) {
                    //console.log("Deleted: " + name);
                    placeStore.delete(name);
                }
            }
        }
    } else {
        loadingMessage(obj);
        // call places API and populate the data structure with placename,
        //country name, placeID
        queryPlaces(place, placeStore);
    }
    // createDropdown(placeStore, dropDownObj);
}

// Calls places API and populates input data structure
function queryPlaces(place, placeStore) {
    //console.log("queryplaces");
    fetch(`https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/US/USD/en-US/?query=${place}`, {
        "method": "GET",
        "headers": {
            "x-rapidapi-host": `${rapidapiHost}`,
            "x-rapidapi-key": `${rapidapiKey}`
        }
    })
        .then(response => response.json())
        .then(data => storePlaces(data, placeStore))
        .catch(err => console.log(err));
}

function storePlaces(data, placeStore) {
    const places = data.Places;
    for (let i = 0; i < places.length; i++) {
        let p = places[i];
        placeStore.set(p.PlaceName, p.PlaceId);
    }
}

// Creates a dropdown menu based on the place values stored
function createDropdown(placeStore, dropDownObj) {
    // for each item in placeStore, create a dropdown item with eventlistener,
    // placeclicked
    dropDownObj.innerHTML = "";
    //console.log("create dropdown");
    // Dropdown container
    // create indiviual dropdown elements
    placeStore.forEach((value, key) => {
        let dropItem = document.createElement("li");
        dropItem.setAttribute("class", "dropdown-item");
        dropItem.setAttribute("value", value);
        //console.log(value);
        dropItem.textContent = key;
        dropItem.addEventListener("click", placeClicked);
        dropDownObj.appendChild(dropItem);
    });
}

// creates a loading message for dropdown
function loadingMessage(obj) {
    obj.textContent = "";
    let message = document.createElement("li");
    message.textContent = "loading...";
    obj.appendChild(message);
}

// Handles if dropdown item is clicked
function placeClicked(e) {
    // will change innerhtml of searchbox on click and store various pieces of 
    // info: 
    //Gets the list item, dropdown, and searchbox
    let listItem = e.target;
    let dropDown = e.target.parentNode;
    dropDown.innerHTML = "";
    let searchbox = dropDown.previousSibling.previousSibling;
    searchbox.value = listItem.innerHTML;
    let value = listItem.getAttribute("value");

    if (searchbox.getAttribute("class") === "from-search") {
        originCode = value;
        originClicked = true;
    } else if (searchbox.getAttribute("class") === "to-search") {
        destCode = value;
        destClicked = true;
    }
}

// Once search button is pressed, performs search if all boxes are filled, 
// otherwise creates an error popup
function queryFlights() {
    // check if all boxes are filled, then if originclicked is false, set value
    // of origin code to first value in originStore, same for destination
    //finally run the query, if boxes are not filled generate popup
    const from = origin.value.trim();
    const to = destination.value.trim();
    const dep = ddate.value;
    // checks if all values are filled
    if (from && to && dep) {
        if (!originClicked) {
            originCode = originStore.values().next().value;
        }
        if (!destClicked) {
            destCode = destStore.values().next().value;
        }
        let rmessage = document.querySelector(".results-message");
        rmessage.innerHTML = "RESULTS for " + originCode.replace("-sky", "") + " -> " + destCode.replace("-sky", "");
        getFlights(originCode, destCode, dep);
    } else {
        window.alert("Please make sure all fields are filled.")
    }
}

// calls api to get flights
function getFlights(from, to, dep) {
    fetch(`https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browseroutes/v1.0/US/USD/en-US/${from}/${to}/${dep}?inboundpartialdate=`, {
        "method": "GET",
        "headers": {
            "x-rapidapi-host": `${rapidapiHost}`,
            "x-rapidapi-key": `${rapidapiKey}`
        }
    })
        .then(response => response.json())
        .then(data => displayFlights(data))
        .catch(err => console.log(err));
}

// Displays flights in the results 
const resultsbox = document.querySelector(".search-result");

function displayFlights(response) {
    resultsbox.innerHTML = "";
    // No results
    if (response.Quotes.length == 0) {
        resultsbox.innerHTML = "No results found. Try narrowing down your search by choosing one of the dropdown options.";
    } else {
        // airline carriers
        let carriers = response.Carriers;
        let carrierMap = new Map();

        for (let i = 0; i < carriers.length; i++) {
            carrierMap.set(carriers[i].CarrierId, carriers[i].Name);
        }
        // quotes
        let quote = response.Quotes;
        //console.log(quote);
        for (let i = 0; i < quote.length; i++) {
            createListing(quote[i], carrierMap);
        }
    }
}

//creates listings for the results
function createListing(quote, map) {
    // create listing item
    let listing = document.createElement("div");
    listing.setAttribute("class", "listing");
    // Price
    let price = document.createElement("div");
    price.innerHTML = "$" + quote.MinPrice;
    // airline depart

    let dtime = document.createElement("div");
    dtime.innerHTML = "\/ " + quote.OutboundLeg.DepartureDate.slice(5, 10);

    let dairline = document.createElement("div");
    dairline.innerHTML = "\/ " + map.get(quote.OutboundLeg.CarrierIds[0]);

    price.setAttribute("class", "result-info result-price");
    dtime.setAttribute("class", "result-info result-date");
    dairline.setAttribute("class", "result-info result-air");

    // // airline arrive
    // let arrive = document.createElement("div");
    // arrive.setAttribute("class", "airline-time-block");

    // let atime = document.createElement("div");
    // dtime.innerHTML = quote.InboundLeg.DepartureDate;

    // let aairline = document.createElement("div");
    // aairline.innerHTML = map.get(quote.InboundLeg.CarrierIds[0]);

    // arrive.appendChild(atime);
    // arrive.appendChild(aairline);

    listing.appendChild(price);
    listing.appendChild(dtime);
    listing.appendChild(dairline);
    // listing.appendChild(arrive);
    // listing.appendChild(rarrow);

    resultsbox.appendChild(listing);
    resultsbox.appendChild(document.createElement("hr"));
}