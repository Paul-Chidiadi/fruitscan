"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/scan");
    }, 6000);
  }, []);

  return (
    <div className="splash">
      <i className="bx bx-lemon bx-spin"></i>
      <h3>fruitScan</h3>
    </div>
  );
}
