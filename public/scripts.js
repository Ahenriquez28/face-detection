console.log(faceapi);

const run = async () => {
    // Load the models
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models'),
    ]);

    // Get the video stream
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    });
    const videoFeedEl = document.getElementById('video-feed');
    videoFeedEl.srcObject = stream;

    // Set up the canvas
    const canvas = document.getElementById('canvas');

    // Function to update canvas size based on video feed dimensions
    const updateCanvasSize = () => {
        canvas.style.left = `${videoFeedEl.offsetLeft}px`;
        canvas.style.top = `${videoFeedEl.offsetTop}px`;
        canvas.height = videoFeedEl.videoHeight;
        canvas.width = videoFeedEl.videoWidth;
    };
    updateCanvasSize(); // Initial call to set canvas size

    // Add event listener to update canvas size on window resize
    window.addEventListener('resize', updateCanvasSize);

    // Load the reference image
    const refface = await faceapi.fetchImage('https://pbs.twimg.com/profile_images/552307347851210752/vrXDcTFC_400x400.jpeg');
    const refFaceAiData = await faceapi.detectAllFaces(refface).withFaceLandmarks().withFaceDescriptors();
    const faceMatcher = new faceapi.FaceMatcher(refFaceAiData);

    // Facial detection with points
    setInterval(async () => {
        const faceAIData = await faceapi.detectAllFaces(videoFeedEl).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions();

        // Clear the canvas
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Resize results to match the video feed
        const resizedResults = faceapi.resizeResults(faceAIData, videoFeedEl);

        // Draw detections, landmarks, and expressions
        faceapi.draw.drawDetections(canvas, resizedResults);
        faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
        faceapi.draw.drawFaceExpressions(canvas, resizedResults);

        // Draw age and gender
        resizedResults.forEach(face => {
            const { age, gender, genderProbability, detection, descriptor } = face;
            const genderText = `${gender} - ${Math.round(genderProbability * 100)}%`;
            const ageText = `${Math.round(age)} years`;
            const textField = new faceapi.draw.DrawTextField([genderText, ageText], detection.box.topRight);
            textField.draw(canvas);

            // Match face with reference
            const label = faceMatcher.findBestMatch(descriptor).toString();
            const options = { label: label.includes("unknown") ? "Unknown person" : "Joe" };
            const drawBox = new faceapi.draw.DrawBox(detection.box, options);
            drawBox.draw(canvas);
        });
    }, 200);
};

run();
