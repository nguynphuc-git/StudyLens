export interface ImageSize {width:number;height:number}
export const MIN_IMAGE_ZOOM=.01,MAX_IMAGE_ZOOM=5;
export function imageZoom(value:number){return Math.max(MIN_IMAGE_ZOOM,Math.min(MAX_IMAGE_ZOOM,value));}
export function fitImage(image:ImageSize,viewport:ImageSize):number {
  if(!image.width||!image.height||!viewport.width||!viewport.height)return 1;
  return imageZoom(Math.min(1,Math.max(1,viewport.width-32)/image.width,Math.max(1,viewport.height-32)/image.height));
}
