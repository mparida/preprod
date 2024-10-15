/* eslint-disable @locker/locker/distorted-storage-constructor */
export const height = 'texareaHeight';

export  const   setLocalStorage =(value) =>{
      window.localStorage.setItem(height, JSON.stringify(value));
    }
  
 export const    getLocalStorage= ()=> {
      const value = window.localStorage.getItem(height);
      return JSON.parse(value);
    }
  
export const remove= () => {
      window.localStorage.removeItem(this.storageKey);
}