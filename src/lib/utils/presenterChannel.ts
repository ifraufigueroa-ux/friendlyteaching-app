// FriendlyTeaching.cl — Presenter View BroadcastChannel protocol
// Synchronizes slide navigation between main classroom window and presenter window.

export const PRESENTER_CHANNEL = 'ft-presenter-sync';

export type PresenterMessage =
  | { type: 'SLIDE_CHANGE'; slideIndex: number; totalSlides: number; lessonId: string }
  | { type: 'ANSWER_UPDATE'; slideIndex: number; isCorrect: boolean }
  | { type: 'SESSION_START'; lessonId: string; lessonTitle: string; totalSlides: number }
  | { type: 'SESSION_END' }
  | { type: 'PING' }
  | { type: 'PONG' };

let channel: BroadcastChannel | null = null;

export function getPresenterChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(PRESENTER_CHANNEL);
  }
  return channel;
}

export function sendPresenterMessage(msg: PresenterMessage) {
  try {
    getPresenterChannel().postMessage(msg);
  } catch {
    // Channel might be closed
  }
}

export function closePresenterChannel() {
  if (channel) {
    channel.close();
    channel = null;
  }
}
