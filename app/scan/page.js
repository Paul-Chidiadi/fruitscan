"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";

export default function Scan() {
  const [camView, setCamView] = useState("environment");
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bestMatch, setBestMatch] = useState(null);
  const [classifier, setClassifier] = useState(null);
  const [net, setNet] = useState(null);
  const [webcam, setWebcam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confidence, setConfidence] = useState(null);
  const [imageNames, setImageNames] = useState([
    "almond Plant",
    "almonddry Plant",
    "almondleaf Plant",
    "avocado Plant",
    "avocadodry Plant",
    "avocadoleaf Plant",
    "cashew Plant",
    "cashewdry Plant",
    "cashewleaf Plant",
    "guava Plant",
    "guavadry Plant",
    "guavaleaf Plant",
    "mango Plant",
    "mangodry Plant",
    "mangoleaf Plant",
  ]);

  console.log(imageUrl);
  console.log(bestMatch);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    setImageUrl(file);
    // Use createImageBitmap to create an Image object from the File
    const img = await createImageBitmap(file);
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;
    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0);
    // Get ImageData from the canvas
    const newImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUploadedImage(newImgData);

    // CALL COMPARISION FUNCTION AFTER UPLOADING IMAGE
    await compareWithDataset();
  };

  const handleCapture = async () => {
    const webcam = await tf.data.webcam(videoRef.current);
    const img = await webcam.capture();
    setImageUrl(img);
    const converted = tensorToImageData(img);
    console.log(converted);
    setUploadedImage(converted);

    // CALL COMPARISION FUNCTION AFTER UPLOADING IMAGE
    await compareWithDataset();
  };

  const tensorToImageData = (tensor) => {
    // Get the data from the TensorFlow tensor
    const data = tensor.dataSync();

    // Get the dimensions of the image
    const [height, width, channels] = tensor.shape;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Create an empty ImageData object
    const upImg = ctx.createImageData(width, height);

    // Fill the ImageData with the pixel data from the TensorFlow tensor
    for (let i = 0; i < data.length; i++) {
      upImg.data[i] = data[i];
    }

    // Draw the ImageData onto the canvas
    ctx.putImageData(upImg, 0, 0);

    // Return the ImageData object
    return upImg;
  };

  const loadImageToImageData = async (imageUrl) => {
    try {
      // Fetch the image file as binary data
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Create an image element
      const img = document.createElement("img");

      // Set up a promise to resolve when the image is loaded
      const imageLoaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Set the src attribute to the image data
      img.src = URL.createObjectURL(new Blob([arrayBuffer]));

      // Wait for the image to be loaded
      await imageLoaded;

      // Create a canvas element and draw the image onto it
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get the ImageData object
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Return the ImageData object
      return imageData;
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  };

  const compareWithDataset = async () => {
    // Define your dataset containing paths to images
    const dataset = [
      "labels/almond.png",
      "labels/almonddry.png",
      "labels/almondleaf.png",
      "labels/avocado.png",
      "labels/avocadodry.png",
      "labels/avocadoleaf.png",
      "labels/cashew.png",
      "labels/cashewdry.png",
      "labels/cashewleaf.png",
      "labels/guava.png",
      "labels/guavadry.png",
      "labels/guavaleaf.png",
      "labels/mango.png",
      "labels/mangodry.png",
      "labels/mangoleaf.png",
    ];
    for (let i = 0; i < dataset.length; i++) {
      const imageData = await loadImageToImageData(dataset[i]);
      console.log(imageData);
      const activation = net.infer(imageData, true);
      classifier.addExample(activation, i);
    }

    console.log(classifier);
    if (classifier.getNumClasses() > 0) {
      const activation = net.infer(uploadedImage, "conv_preds");
      const result = await classifier.predictClass(activation);
      console.log(result);

      console.log(result.label);
      setBestMatch(imageNames[result.label]);
      setConfidence(result.confidences[result.label]);
    }
    overlayRef.current.style.display = `flex`;
  };

  useEffect(() => {
    async function initialize() {
      console.log("Loading mobilenet...");
      const loadedNet = await mobilenet.load();
      console.log("Loaded model");
      setNet(loadedNet);

      const knn = knnClassifier.create();
      setClassifier(knn);

      const webcamElement = videoRef.current;
      const loadedWebcam = await tf.data.webcam(webcamElement);
      setWebcam(loadedWebcam);

      setLoading(false);
    }

    initialize();

    return () => {
      // Clean up TensorFlow resources
      if (webcam) webcam.stop();
    };
  }, []);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: camView }, // Try to use rear camera
          },
          audio: false,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error(error);
        console.log("Attempting to use front camera...");
        // If using rear camera fails, try using front camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
          videoRef.current.srcObject = stream;
        } catch (error) {
          console.error("Error accessing camera:", error);
          // Display error message or take appropriate action
        }
      }
    };

    startWebcam();

    return () => {
      // Cleanup code if needed
    };
  });

  return (
    <>
      <div className="cam-container">
        <div className="top">
          <i
            className="bx bx-repeat"
            onClick={() => {
              setCamView((prev) =>
                prev === "environment" ? "user" : "environment"
              );
            }}
          ></i>
        </div>
        <video ref={videoRef} autoPlay playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="bottom">
          <i className="bx bx-scan" onClick={handleCapture}></i>
          <p onClick={handleFileClick}>
            Gallery
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </p>
        </div>
      </div>

      {/* POP UP */}
      <div className="overlay" id="overlay" ref={overlayRef}>
        <div className="popup">
          <span
            className="close-btn"
            onClick={() => (overlayRef.current.style.display = `none`)}
          >
            &times;
          </span>
          <>
            {/* <h1>
              <i className="bx bx-x"></i>Undetected
            </h1>
            <small>The scanned image does not exist in the trained model</small> */}
            <h1>
              <i className="bx bx-check"></i>Detection Result
            </h1>
            <small>
              The scanned image is a <span>{bestMatch}</span> with a confidence
              level of <span>{confidence}</span>
            </small>
            <div className="scanned-image">
              <Image
                className="inner-image"
                src={imageUrl}
                width={150}
                height={150}
                alt=""
              />
            </div>
          </>
        </div>
      </div>
    </>
  );
}
