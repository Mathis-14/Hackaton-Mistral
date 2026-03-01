export const PHISHING_TRIGGER_BUTTON_LABEL = "Infiltrate Arthur Mencher computer";
export const PHISHING_ENDING_MUSIC_SRC = "/sounds/music/good-ending-music.mp3";

export function shouldPauseForPhishingEnding(audioSrc: string): boolean {
  return audioSrc.includes("/sounds/music/cinematic-music/");
}
