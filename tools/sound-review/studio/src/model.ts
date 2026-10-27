import questionRows from './questions.json';
import contextDefinitions from '../contexts.json';
export {contextDefinitions};
export type Kind = 'music' | 'effect';
export type Context = keyof typeof contextDefinitions;
export type ReviewStatus = 'unreviewed' | 'shortlist' | 'rejected';
export type SelectionKey = 'feeling' | 'start' | 'change' | 'end' | 'launch';
export interface Asset {
  id:string; kind:Kind; title:string; provider:string; sourceUrl:string|null;
  licenseUrl:string|null; licenseName:string|null; ai:boolean; contexts:Context[];
  duration:number; format:string; audioUrl:string; waveform:number[]; anchor?:number;
  audioMode?:'local'|'provider'|'source'; credit?:string; sourceNote?:string;
}
export interface Catalogue {assets:Asset[]; generatedAt:string;}
export interface Review {
  status:ReviewStatus; selections:Partial<Record<SelectionKey,string[]>>;
  notes:string; avoid_with:string[]; listener:string; updatedAt?:string;
  legacy?:{feeling:string; progression:string; use_with:string[]};
  aiSuggestion?:{
    model:string; launch:string[]; method:string; createdAt:string;
    answers?:Record<Exclude<SelectionKey,'launch'>,{choices:string[]; reason:string}>;
    notes?:string; avoid_with?:string[]; caveat?:string;
  };
}
export interface EffectChoice {effect:string|null; alternatives?:string[]; listener:string; reason:string; source?:unknown;}
export const rankedEffects = (choice?:EffectChoice):string[] => choice?.effect ? [choice.effect, ...choice.alternatives ?? []] : [];
export interface ReviewDocument {
  version:1; revision:number; listener:string; updatedAt:string;
  reviews:Record<string,Review>; contextChoices:Partial<Record<Context,EffectChoice>>;
}
export const contextLabels = Object.fromEntries(Object.entries(contextDefinitions).map(([id, value]) => [id, value.label])) as Record<Context,string>;
export const statusLabels:Record<ReviewStatus,string>={unreviewed:'İncelenmedi',shortlist:'Seçkiye aldım',rejected:'Uygun değil'};
export const emptyReview = (listener=''):Review => ({status:'unreviewed',selections:{},notes:'',avoid_with:[],listener});
export const questions = questionRows as {key:SelectionKey;label:string;options:string[]}[];
