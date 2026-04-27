"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./Welcome.module.css";

interface WelcomeScreenProps {
  onExit?: () => void;
}

export function WelcomeScreen({ onExit }: WelcomeScreenProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleClick = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      if (onExit) {
        onExit();
      } else {
        router.push("/login");
      }
    }, 500);
  };

  return (
    <div
      className={`${styles.container} ${isExiting ? styles.exiting : ""}`}
      onClick={handleClick}
    >
      <Image
        src="/supportsync-logo.jpg"
        alt="SupportSync Logo"
        width={150}
        height={40}
        className={styles.logo}
      />

      <div className={styles.orbContainer}>
        {/* --- Orb Background Layer --- */}
        <div className={styles.orb} />

        {/* --- Welcome Text --- */}
        <h1 className={styles.welcomeText}>
          SupportSync Welcomes You
        </h1>

        {/* --- Click Handler Hint --- */}
        <p className={styles.hintText}>
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}
