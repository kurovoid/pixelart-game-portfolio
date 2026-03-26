import Phaser from 'phaser';

export interface InteractionZone {
  name: string;
  type: string;
  dialogueId: string;
  label: string;
  bounds: Phaser.Geom.Rectangle;
}

export interface DialogueStep {
  text: string;
  speaker?: string;
}

export interface DialogueSequence {
  id: string;
  steps: DialogueStep[];
}

export interface DialogueDatabase {
  dialogues: Record<string, DialogueSequence>;
}

export type DialogueState = 'IDLE' | 'TYPING' | 'WAITING' | 'DONE';
