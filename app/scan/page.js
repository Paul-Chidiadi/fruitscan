"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";

export default function Scan() {
  const [camView, setCamView] = useState("environment");
  const [response, setResponse] = useState("");
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const loadingRef = useRef(null);
  const responseRef = useRef(null);
  const fileInputRef = useRef(null);
  const apiUrl = "54.221.17.210:8000/predict";

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log(file);
    overlayRef.current.style.display = `flex`;
    loadingRef.current.style.display = `block`;
    uploadImageToBackend(file);
  };

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to a Blob
    canvas.toBlob((blob) => {
      // Create a File from the Blob
      const file = new File([blob], "captured_image.png", {
        type: "image/png",
        lastModified: Date.now(),
      });

      // Log the File object to see its properties
      console.log(file);
      overlayRef.current.style.display = `flex`;
      loadingRef.current.style.display = `block`;
      uploadImageToBackend(file);

      // Optionally, you can now upload the file or process it as needed
    }, "image/png");
  };

  async function uploadImageToBackend(imageData) {
    try {
      const formData = new FormData();
      formData.append("image", imageData);
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Response:", data);
        setResponse(data.prediction);
        loadingRef.current.style.display = `none`;
        responseRef.current.style.display = `block`;
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }

  console.log(camView);

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
          <i className="bx bx-scan" onClick={captureImage}></i>
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
            onClick={() => {
              overlayRef.current.style.display = `none`;
              loadingRef.current.style.display = `none`;
              responseRef.current.style.display = `none`;
            }}
          >
            &times;
          </span>
          <>
            {/* LOADING */}
            <div style={{ display: "none" }} id="loading" ref={loadingRef}>
              <h1>
                <i className="bx bx-loader-alt bx-spin"></i>Loading...
              </h1>
              <small>Detection in progress...</small>
            </div>
            {/* RESPONSE */}
            <div style={{ display: "none" }} id="response" ref={responseRef}>
              <h1>
                <i className="bx bx-check"></i>Detected
              </h1>
              <small>The scanned image is a {response} plant</small>
              {/* <div className="scanned-image"></div> */}
            </div>
          </>
        </div>
      </div>
    </>
  );
}
