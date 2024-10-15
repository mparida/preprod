/* eslint-disable @lwc/lwc/no-async-operation */
/* eslint-disable  @locker/locker/distorted-window-set-timeout */
/* eslint-disable @locker/locker/distorted-storage-constructor */
const STORAGE_KEY = {
    chatType: 'chatType',
    isAsync:'isAsync',
    action:'action',
    chatTypeIcons: 'chatTypeIcons',
    activeChats:'activeChats',
 
}

let isDebugging =false;

function getLocalStorageItem(key) {
    try {
        const serializedValue = localStorage.getItem(key);
        return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
        console.error(`Error while getting getLocalStorage item ${key}:`, error);
        return null;
    }
}

function setLocalStorageItem(key, value) {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`Error while setting getLocalStorage item ${key}:`, error);
    }
}


function getSessionStorageItem(key) {
    try {
        const serializedValue = sessionStorage.getItem(key);
        return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
        console.error(`Error while getting sessionStorage item ${key}:`, error);
        return null;
    }
}

function setSessionStorageItem(key, value) {
    try {
        const serializedValue = JSON.stringify(value);
        sessionStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`Error while setting sessionStorage item ${key}:`, error);
    }
}



function log(status,lwc, message){
    if (isDebugging)
    {
        if (localStorage.corallog === 'suppress') return;
        let date = new Date();
        let datestring = '';
        datestring = padding(date.getFullYear().toString()) +
            padding(date.getMonth() + 1) + padding(date.getDate()) + ' ' +
            padding(date.getHours()) + ':' +
            padding(date.getMinutes()) + ':' +
            padding(date.getSeconds()) + '.' +
            padding(date.getMilliseconds());

        switch (status)
        {
            case 'INFO':
                console.log(datestring + ' > [CHAT: ' + status + '] \x1b[32m' + lwc + '\x1b[0m', { message });
                break;
            case 'WARN':
                console.warn(datestring + ' > [CHAT: ' + status + '] \x1b[33m' + lwc + '\x1b[0m', { message });
                break;
            case 'ERROR':
                console.error(datestring + ' > [CHAT: ' + status + '] ' + lwc, { message });
                break;
            default:
                console.log(datestring + ' > [CHAT: INFO] ' + lwc, { message });
                break;
        }
    }
}

function padding(n){
    return (n < 10 ? '0' : '') + n;
}

 /* diasbled eslint here for usage of settimeout, we are using this delay to wait for the tagus response  going to lwc */
function delayTimeout(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function timeout(callback, ms = 0)
{
    await delayTimeout(ms);
    callback();
}


function setLWCDebug(val)
{
    isDebugging = val;
}

window.setLWCDebug = setLWCDebug

  

export {getSessionStorageItem, setSessionStorageItem , STORAGE_KEY , log , timeout , getLocalStorageItem, setLocalStorageItem }