let fromLoc, toLoc;

running = false;

const API_KEY = "4XB9aCOn3-OLQIvLHdZm";


async function getCurrentLocation() {

    let posGetter = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(function (location) {
            resolve(location);
        }, reject);
    });

    return await posGetter;
}


async function getJSON(url) {
    let res;
    try {
        res = await fetch(url);

    } catch (error) {
        console.log(`Network error or invalid url ${url} entered`);
        return;
    }
    let json;
    try {
        json = await res.json();
    } catch (error) {
        return;
    }
    return json;
}

async function getLocationsFromName(address) {
    let url = "https://geocode.maps.co/search?q=" + encodeURIComponent(address) + `&api_key=6594c41809f7d233473125diw2171cf`;
    console.log(url)
    let data = await getJSON(url);
    let locationLatitudeMap = {};

    if (!data) {
        return;
    }

    data.forEach(element => {
        locationLatitudeMap[element["display_name"]] = [element["lat"], element["lon"]];
    });

    return locationLatitudeMap;
}


function filterParams(params) {
    let filtered = {};
    let keys = Object.keys(params);
    for (let index = 2; index < keys.length; index++) {
        const name = keys[index];
        if (params[name]) {
            filtered[name] = params[name];
        }
    }

    return filtered;
}

async function getPlansJsonRaw([lat1, long1], [lat2, long2]) {
    let form = document.getElementsByClassName("mainform")[0];
    let options = filterParams(Object.fromEntries(new FormData(form).entries()));
    let optionsUrlForm = "&" + Object.keys(options).map(function (k) {
        return encodeURIComponent(k) + '=' + options[k]
    }).join('&');
    let url = `https://api.winnipegtransit.com/v3/trip-planner.json?api-key=${API_KEY}&origin=geo/${lat1},${long1}&destination=geo/${lat2},${long2}` + optionsUrlForm;
    let data = await getJSON(url);

    console.log(url);
    return data["plans"];
}

async function test() {
    fromLoc = document.getElementById('origin').value;
    toLoc = document.getElementById('destination').value;
    let location1 = await getLocationsFromName(fromLoc);
    await new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, 2000)
    })
    let location2 = await getLocationsFromName(toLoc);
    let fullname1 = Object.keys(location1).find((j) => j.toLowerCase().indexOf("manitoba") != -1) ?? Object.keys(location1)[0];
    let fullname2 = Object.keys(location2).find((j) => j.toLowerCase().indexOf("manitoba") != -1) ?? Object.keys(location2)[0];

    let lat1, lat2;
    if (document.getElementById("currentBox").checked) {
        let coords = (await getCurrentLocation())["coords"];
        lat1 = [coords.latitude, coords.longitude]
        fullname1 = "current Location";
    } else {
        lat1 = location1[fullname1];
    }
    if (document.getElementById("destBox").checked) {
        let coords = (await getCurrentLocation())["coords"];
        lat2 = [coords.latitude, coords.longitude]
        fullname2 = "current Location";
    } else {
        lat2 = location2[fullname2];
    }

    // coords: GeolocationCoordinates { latitude: 49.9438129, longitude: -97.1679409, accuracy: 18.848, … }
    // console.log(coords.latitude, coords.longitude)
    showRoutes((await getPlansJsonRaw(lat1, lat2)), fullname1, fullname2);
    // document.body.innerHTML += JSON.stringify()[0].segments[0].from)
}


function switchExtras() {
    let extras = document.getElementById("extraSettings")
    if (extras.style.height == "0px")
        extras.style.height = "400px"
    else
        extras.style.height = "0px"
}



function goPressed() {
    let goBtn = document.getElementsByClassName("goBar")[0];

    goBtn.classList.add("bottombus");


    let form = document.getElementsByTagName("form")[0];
    for (let index = 0; index < form.children.length; index++) {
        form.children[index].style.opacity = 0;

    }

    document.getElementsByClassName("loadingIndicator")[0].style.display = 'block';

    setTimeout(async () => {
        try {
            await test();
        } catch (error) {
            alert("No Route found!");
        }
        window.scrollBy({ "left": 0, "top": window.innerHeight, "behavior": "smooth" });

        let goBtn = document.getElementsByClassName("goBar")[0];

        goBtn.classList.remove("bottombus");


        let form = document.getElementsByTagName("form")[0];
        for (let index = 0; index < form.children.length; index++) {
            form.children[index].style.opacity = 1;

        }

        document.getElementsByClassName("loadingIndicator")[0].style.display = '';
    }, 5000);


}

function load() {
    document.getElementById("extracontroller").addEventListener("click", switchExtras);
    document.getElementsByClassName("goBar")[0].addEventListener("click", goPressed);
}

function toggle(id) {
    let element = document.getElementById(id);
    if (!element.disabled)
        element.disabled = true
    else element.disabled = false;
}


function parseTime(timestr) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const currentDate = new Date();
    const inputDate = new Date(timestr);

    const isToday = currentDate.toDateString() === inputDate.toDateString();

    const time = inputDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const date = isToday ? '' : `${months[inputDate.getMonth()]} ${inputDate.getDate()}, ${inputDate.getFullYear()}`;

    return `${time}${isToday ? '' : ' (' + date + ')'}`;
}


function showRoutes(rawPlan, origin, destination) {

    let plans = document.getElementById("plans");
    plans.innerHTML = rawPlan.length > 0 ? '' : "<b> No route found </b>";

    rawPlan.forEach((plan, index) => {
        plans.innerHTML += "<hr>"
        plans.innerHTML += `<p> Plan ${index + 1} </p>`
        plans.innerHTML += "<hr>"
        let planDiv = document.createElement("div");
        planDiv.classList.add("plan");

        let fromDiv = document.createElement("div");
        fromDiv.classList.add("from");
        fromDiv.textContent = origin.length < 30 ? origin : origin.substring(0, 30) + "...."; // Set origin text content

        let toDiv = document.createElement("div");
        toDiv.classList.add("to");
        toDiv.textContent = destination.length < 30 ? destination : destination.substring(0, 30) + "....";; // Set destination text content

        let walkTime = document.createElement("div");
        walkTime.classList.add("walk-time");
        walkTime.textContent = `🥾${plan.times.durations.walking} min`; // Set walking time

        let busTime = document.createElement("div");
        busTime.classList.add("bus-time");
        busTime.textContent = `🚌${plan.times.durations.riding} min`; // Set bus riding time

        let waitTime = document.createElement("div");
        waitTime.classList.add("wait-time");
        waitTime.textContent = `⌚${plan.times.durations.waiting} min`; // Set waiting time

        let startAt = document.createElement("div");
        startAt.classList.add("start-at");
        startAt.textContent = parseTime(plan.times.start); // Set start time

        let endAt = document.createElement("div");
        endAt.classList.add("end-at");
        endAt.textContent = parseTime(plan.times.end); // Set end time

        planDiv.appendChild(fromDiv);
        planDiv.appendChild(toDiv);
        planDiv.appendChild(walkTime);
        planDiv.appendChild(busTime);
        planDiv.appendChild(waitTime);
        planDiv.appendChild(startAt);
        planDiv.appendChild(endAt);
        plan.segments.forEach((segment, index) => {
            let segmentDiv = document.createElement("div");
            segmentDiv.classList.add("segment");

            let segmentType = document.createElement("div");
            segmentType.classList.add("segment-type");
            if (segment.type == "ride") {
                segmentType.innerHTML = "Ride bus: <b>" + segment.route.name + ((Object.keys(plan.segments[index + 1]).includes("from")) ? ("</b> till <b>" + plan.segments[index + 1].from.stop.name + "</b>") : "");
            }
            if (segment.type == "transfer") {
                if (segment.from.stop.name == segment.to.stop.name)
                    segmentType.innerHTML = "Change bus at: <b>" + segment.to.stop.name + "</b>"
                else
                    segmentType.innerHTML = "Get off at <b>" + segment.from.stop.name + "</b> and move to <b>" + segment.to.stop.name + "</b>";

            }

            if (segment.type == "walk") {
                segmentType.innerHTML = "Walk to: <b>" + (index == plan.segments.length - 1 ? destination : segment.to.stop.name) + "</b>";
            }

            let segmentStartTime = document.createElement("div");
            segmentStartTime.classList.add("segment-start-time");
            segmentStartTime.textContent = parseTime(segment.times.start); // Set segment start time

            let segmentEndTime = document.createElement("div");
            segmentEndTime.classList.add("segment-end-time");
            segmentEndTime.textContent = parseTime(segment.times.end) + " Totals: " + segment.times.durations.total + " min"; // Set segment end time


            segmentDiv.appendChild(segmentType);
            segmentDiv.appendChild(segmentStartTime);
            segmentDiv.appendChild(segmentEndTime);

            planDiv.appendChild(segmentDiv);
        });

        // Append the created elements to their respective parent elements

        plans.appendChild(planDiv);

    });
}



document.addEventListener("DOMContentLoaded", load)

