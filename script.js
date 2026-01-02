const video = document.getElementById("video");
const alertBox = document.getElementById("alert");
const alarm = document.getElementById("alarm");

let lastNoseX = null;

function showAlert(msg) {
  alertBox.innerText = "⚠️ " + msg;
  alertBox.style.display = "block";
  alarm.play();
}

function hideAlert() {
  alertBox.style.display = "none";
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

async function loadModel() {
  return await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );
}

startCamera();

loadModel().then(model => {
  setInterval(async () => {

    const predictions = await model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: false,
      predictIrises: true
    });

    // ❌ لا يوجد وجه
    if (predictions.length === 0) {
      showAlert("No face detected");
      return;
    }

    // ❌ أكثر من وجه
    if (predictions.length > 1) {
      showAlert("More than one person detected");
      return;
    }

    const face = predictions[0];
    const nose = face.scaledMesh[1];

    // حركة الرأس
    if (lastNoseX !== null && Math.abs(nose[0] - lastNoseX) > 30) {
      showAlert("Head movement detected");
      lastNoseX = nose[0];
      return;
    }

    lastNoseX = nose[0];

    // فحص الإضاءة
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const pixel = ctx.getImageData(10, 10, 1, 1).data;
    const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;

    if (brightness < 40) {
      showAlert("Low lighting detected");
      return;
    }

    hideAlert();

  }, 1500);
});
