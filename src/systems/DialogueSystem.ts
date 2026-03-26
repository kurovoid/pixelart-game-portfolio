import { EVENTS } from '../constants';
import { EventBus } from './EventBus';
import type { InteractionZone, DialogueSequence, DialogueState, DialogueStep } from '../types/dialogue';
import dialogueData from '../data/dialogues.json';

const TYPING_SPEED = 30; // ms per character

export class DialogueSystem {
  private state: DialogueState = 'IDLE';
  private currentSequence: DialogueSequence | null = null;
  private currentStepIndex = 0;
  private typingTimer: ReturnType<typeof setInterval> | null = null;
  private displayedCharCount = 0;

  constructor() {
    EventBus.on(EVENTS.INTERACTION_TRIGGERED, this.onInteraction, this);
  }

  private get currentStep(): DialogueStep | null {
    if (!this.currentSequence) return null;
    return this.currentSequence.steps[this.currentStepIndex] ?? null;
  }

  private get currentFullText(): string {
    return this.currentStep?.text ?? '';
  }

  private onInteraction(zone: InteractionZone): void {
    if (this.state !== 'IDLE') return;

    const sequence = (dialogueData as { dialogues: Record<string, DialogueSequence> }).dialogues[zone.dialogueId];
    if (!sequence) return;

    this.currentSequence = sequence;
    this.currentStepIndex = 0;
    this.state = 'TYPING';

    EventBus.emit(EVENTS.DIALOGUE_START);
    this.startTyping();
  }

  advance(): void {
    if (this.state === 'TYPING') {
      // Skip to full text
      this.stopTyping();
      this.displayedCharCount = this.currentFullText.length;
      this.state = 'WAITING';
      EventBus.emit('dialogue:update', {
        text: this.currentFullText,
        speaker: this.currentStep?.speaker ?? null,
        displayedText: this.currentFullText,
        isComplete: true,
      });
      return;
    }

    if (this.state === 'WAITING') {
      this.currentStepIndex++;
      if (this.currentStepIndex >= (this.currentSequence?.steps.length ?? 0)) {
        this.finish();
      } else {
        this.state = 'TYPING';
        this.startTyping();
      }
    }
  }

  private startTyping(): void {
    this.displayedCharCount = 0;
    const step = this.currentStep;
    if (!step) return;

    // Emit initial state
    EventBus.emit('dialogue:update', {
      text: step.text,
      speaker: step.speaker ?? null,
      displayedText: '',
      isComplete: false,
    });

    this.typingTimer = setInterval(() => {
      this.displayedCharCount++;
      const displayed = step.text.substring(0, this.displayedCharCount);

      if (this.displayedCharCount >= step.text.length) {
        this.stopTyping();
        this.state = 'WAITING';
        EventBus.emit('dialogue:update', {
          text: step.text,
          speaker: step.speaker ?? null,
          displayedText: step.text,
          isComplete: true,
        });
      } else {
        EventBus.emit('dialogue:update', {
          text: step.text,
          speaker: step.speaker ?? null,
          displayedText: displayed,
          isComplete: false,
        });
      }
    }, TYPING_SPEED);
  }

  private stopTyping(): void {
    if (this.typingTimer !== null) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  private finish(): void {
    this.stopTyping();
    this.state = 'IDLE';
    this.currentSequence = null;
    this.currentStepIndex = 0;
    EventBus.emit(EVENTS.DIALOGUE_END);
  }

  isActive(): boolean {
    return this.state !== 'IDLE';
  }

  destroy(): void {
    this.stopTyping();
    EventBus.off(EVENTS.INTERACTION_TRIGGERED, this.onInteraction, this);
  }
}
