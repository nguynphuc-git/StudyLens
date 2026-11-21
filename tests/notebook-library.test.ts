import {describe,expect,it} from 'vitest';
import {findExercises} from '../src/notebook-library';
import {newExercise} from '../src/notebook';
const pages=[{...newExercise(),id:'a',title:'Ánh xạ',notes:'induction proof',statement:'x=1',folderId:'algebra',updatedAt:'2026-11-10T00:00:00Z'},
  {...newExercise(),id:'b',title:'Quadratic',statement:'x^2=4',folderId:'general',completed:true,updatedAt:'2026-11-16T00:00:00Z'}];
const defaults={folder:null,query:'',sort:'recent' as const,completion:'all' as const};
describe('exercise library search and ordering',()=>{
  it('searches names with accents, problem text and notes across folders',()=>{
    for(const query of ['anh xa','induction','x=1'])expect(findExercises(pages,{...defaults,query}).map(x=>x.id)).toEqual(['a']);
    expect(findExercises(pages,{...defaults,query:'x^2'}).map(x=>x.id)).toEqual(['b']);
  });
  it('combines folder and completion filters without modifying the notebook order',()=>{
    expect(findExercises(pages,{...defaults,completion:'completed'}).map(x=>x.id)).toEqual(['b']);
    expect(findExercises(pages,{...defaults,folder:'algebra',completion:'completed'})).toEqual([]);
    expect(findExercises(pages,defaults).map(x=>x.id)).toEqual(['b','a']);
    expect(findExercises(pages,{...defaults,sort:'oldest'}).map(x=>x.id)).toEqual(['a','b']);
    expect(pages.map(x=>x.id)).toEqual(['a','b']);
  });
});

it('finds Vietnamese đ and Đ with an unaccented query',()=>{
  const exercises=[{...newExercise(),title:'Đường thẳng',notes:'đạo hàm'}];
  for(const query of ['duong thang','DAO HAM','ĐƯỜNG']){
    expect(findExercises(exercises,{...defaults,query})).toHaveLength(1);
  }
});
