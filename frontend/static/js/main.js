const photo = document.getElementById("photo");
const photoLabel = document.getElementById("open-photo");
const previewPanel = document.getElementById("previewImage");
const table = document.getElementById("table-info");

const uploadButton = document.getElementById("upload-photo");
const removeButton = document.getElementById("remove-data");

let GoogleMap;

function truncateText(text, maxsize = 12) {
  if (text.length > maxsize) {
    return text.substring(0, maxsize) + '...';
  }
  return text;
}

function truncate(input, maxsize = 12) {
  if (input.length > maxsize) {
    return input.substring(0, maxsize) + '...';
  }
  return input;
}

function initMap() {
  GoogleMap = new google.maps.Map(document.getElementById("map"), {
    zoom: 17,
    center: {
      lat: -34.397,
      lng: 150.644
    },
  });
}

function populateTable(data) {

  const properties = data["data"];
  let rowCounter = 1;

  let GPSCoordinates = properties['GPSPosition'];
  if (GPSCoordinates) {
    const [lat, , lng] = GPSCoordinates.split(" ");
    const marker = new google.maps.Marker({
      "position": {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }
    });
    GoogleMap.setZoom(17);
    marker.setMap(GoogleMap);
    GoogleMap.panTo(marker.position);
  }

  for (const prop in properties) {
    let row = table.insertRow(-1);
    let propNum = row.insertCell(0);
    let propName = row.insertCell(1);
    let propValue = row.insertCell(2);
    propNum.appendChild(document.createTextNode(rowCounter));
    propName.appendChild(document.createTextNode(prop));
    propValue.appendChild(document.createTextNode(properties[prop]));
    rowCounter++;
  }
}


async function uploadImage() {
  if (!photo.value) {
    alert("First you need to choice an image")
  }
  const formData = new FormData();
  formData.append("photo", photo.files[0]);
  const response = await fetch("api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  removeButton.removeAttribute("disabled");
  populateTable(data);
}


async function removeData() {

  if (!photo.value) {
    alert("First you need to choice an image")
  }
  const formData = new FormData();

  formData.append("photo", photo.files[0]);
  const response = await fetch("api/remove", {
    method: "POST",
    body: formData,
  });
  const reader = response.body.getReader();
  let chunks = [];
  while (true) {
    const {
      value,
      done
    } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  let blob = new Blob(chunks);
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${photo.files[0].name}`;
  link.click();
  URL.revokeObjectURL(link.href);
}


function loadImage() {
  const file = this.files[0];
  const reader = new FileReader();

  reader.addEventListener("load", function () {
    let result = reader.result;
    photoLabel.innerText = `Filename: ${truncateText(file.name)}`;
    previewPanel.setAttribute("src", result);
    uploadButton.removeAttribute("disabled");
  });

  if (file) {
    reader.readAsDataURL(file);
  };
}



photo.addEventListener("change", loadImage);