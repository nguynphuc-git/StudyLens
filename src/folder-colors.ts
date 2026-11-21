export const folderColors=[
  {id:'sage',name:'Sage'},
  {id:'sky',name:'Sky'},
  {id:'lavender',name:'Lavender'},
  {id:'rose',name:'Rose'},
  {id:'peach',name:'Peach'},
  {id:'butter',name:'Butter'},
] as const;
export type FolderColor=typeof folderColors[number]['id'];
export const defaultFolderColor:FolderColor='sage';
export function isFolderColor(value:unknown):value is FolderColor{return folderColors.some(color=>color.id===value);}
/** Old folders need no migration; only known pastel tokens reach styling. */
export function folderColor(value:unknown):typeof folderColors[number]{return folderColors.find(color=>color.id===value)??folderColors[0];}
