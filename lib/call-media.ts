/** Preferred mic processing for cleaner WebRTC audio (AEC / NS / AGC). */
export const CALL_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export function callMediaConstraints(video: boolean): MediaStreamConstraints {
  return {
    audio: CALL_AUDIO_CONSTRAINTS,
    // Keep doctor camera modest — improves Chrome → mobile decode reliability.
    video: video
      ? {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 },
        }
      : false,
  };
}
