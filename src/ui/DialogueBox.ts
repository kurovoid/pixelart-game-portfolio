import { EVENTS } from '../constants';
import { EventBus } from '../systems/EventBus';

interface DialogueUpdatePayload {
  text: string;
  speaker: string | null;
  displayedText: string;
  isComplete: boolean;
}

export class DialogueBox {
  private container: HTMLDivElement;
  private speakerEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private advanceHint: HTMLDivElement;
  private visible = false;

  constructor() {
    // Build DOM structure
    this.container = document.createElement('div');
    this.container.className = 'dialogue-box';
    this.container.style.display = 'none';

    this.speakerEl = document.createElement('div');
    this.speakerEl.className = 'dialogue-speaker';

    const textContainer = document.createElement('div');
    textContainer.className = 'dialogue-text-container';

    this.textEl = document.createElement('div');
    this.textEl.className = 'dialogue-text';

    this.advanceHint = document.createElement('div');
    this.advanceHint.className = 'dialogue-advance-hint';
    this.advanceHint.textContent = '▼';

    textContainer.appendChild(this.textEl);
    textContainer.appendChild(this.advanceHint);
    this.container.appendChild(this.speakerEl);
    this.container.appendChild(textContainer);

    document.getElementById('game-container')!.appendChild(this.container);

    // Listen to dialogue events
    EventBus.on('dialogue:update', this.onUpdate, this);
    EventBus.on(EVENTS.DIALOGUE_START, this.show, this);
    EventBus.on(EVENTS.DIALOGUE_END, this.hide, this);
  }

  private show(): void {
    this.visible = true;
    this.container.style.display = '';
  }

  private hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
    this.textEl.textContent = '';
    this.speakerEl.textContent = '';
    this.advanceHint.style.visibility = 'hidden';
  }

  private onUpdate(data: DialogueUpdatePayload): void {
    if (!this.visible) this.show();

    if (data.speaker) {
      this.speakerEl.textContent = data.speaker;
      this.speakerEl.style.display = '';
    } else {
      this.speakerEl.textContent = '';
      this.speakerEl.style.display = 'none';
    }

    this.textEl.textContent = data.displayedText;

    if (data.isComplete) {
      this.advanceHint.style.visibility = 'visible';
    } else {
      this.advanceHint.style.visibility = 'hidden';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    EventBus.off('dialogue:update', this.onUpdate, this);
    EventBus.off(EVENTS.DIALOGUE_START, this.show, this);
    EventBus.off(EVENTS.DIALOGUE_END, this.hide, this);
    this.container.remove();
  }
}
