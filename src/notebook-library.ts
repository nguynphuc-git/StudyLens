import {inExerciseFolder,type Exercise} from './notebook';
import { stripProblemLayout } from './problem-text';
export type ExerciseSort = 'recent'|'oldest'|'name';
const searchable=(value:string)=>value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/đ/g,'d');
export function findExercises(exercises:Exercise[], options:{folder:string|null;query:string;sort:ExerciseSort;completion:'all'|'progress'|'completed'}):Exercise[] {
  const query=searchable(options.query.trim());
  return exercises.filter(exercise=>(!options.folder || inExerciseFolder(exercise,options.folder))
    && (options.completion==='all' || exercise.completed===(options.completion==='completed'))
    && (!query || searchable(`${exercise.title} ${stripProblemLayout(exercise.statement)} ${exercise.notes}`).includes(query)))
    .sort((a,b)=>options.sort==='name'?a.title.localeCompare(b.title):options.sort==='oldest'?a.updatedAt.localeCompare(b.updatedAt):b.updatedAt.localeCompare(a.updatedAt));
}
