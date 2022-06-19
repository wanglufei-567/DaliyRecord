/**
 * 操作元素的其他属性
 */
export function patchAttr(el,key,nextValue){
    if(nextValue == null){
        el.removeAttribute(key);
    }else{
        el.setAttribute(key,nextValue)
    }
}