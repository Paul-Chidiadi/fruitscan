"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";

export default function Scan() {
  const [camView, setCamView] = useState("environment");
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

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
        // If using rear camera fails, try using front camera
        console.log("Attempting to use front camera...");
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
  }, []);

  return (
    <>
      <div className="cam-container">
        <div className="top">
          <i
            className="bx bx-repeat"
            onClick={() => {
              setCamView((prev) => (prev === "environment" ? "user" : "environment"));
            }}></i>
        </div>
        <video ref={videoRef} autoPlay playsInline />
        <div className="bottom">
          <i className="bx bx-scan"></i>
          <p>Gallery</p>
        </div>
      </div>

      {/* POP UP */}
      <div className="overlay" id="overlay" ref={overlayRef}>
        <div className="popup">
          <span className="close-btn" onClick={() => (overlayRef.current.style.display = `none`)}>
            &times;
          </span>
          <>
            <h1>
              <i className="bx bx-x"></i>Undetected
            </h1>
            <small>The scanned image does not exist in the trained model</small>
            {/* <h1>
              <i className="bx bx-check"></i>Detected
            </h1>
            <small>The scanned image is a Mango Plant</small> */}
            <div className="scanned-image"></div>
          </>
        </div>
      </div>
    </>
  );
}
