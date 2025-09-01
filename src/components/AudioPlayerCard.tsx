// AudioPlayerCard.tsx
import React, { forwardRef } from "react";
import "./AudioPlayerCard.css";

type AudioPlayerCardProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  /** Defaults to /mason.mp3 living in /public */
  src?: string;
  /** If true, fills viewport and centers; otherwise just renders the card */
  fullscreenCenter?: boolean;
};

const AudioPlayerCard = forwardRef<HTMLAudioElement, AudioPlayerCardProps>(
  ({ src = "/mason.wav", fullscreenCenter = true, className, ...rest }, ref) => {
    const Wrapper = fullscreenCenter ? "div" : React.Fragment;
    const wrapperProps = fullscreenCenter
      ? { className: "ap-center-wrap" }
      : {};

    return (
      // @ts-ignore – Wrapper can be Fragment
      <Wrapper {...wrapperProps}>
        <div className={`ap-card ${className ?? ""}`}>
          <audio
            ref={ref}
            className="ap-audio"
            controls
            preload="metadata"
            src={src}
            aria-label="Audio player"
            {...rest}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </Wrapper>
    );
  }
);

AudioPlayerCard.displayName = "AudioPlayerCard";
export default AudioPlayerCard;
