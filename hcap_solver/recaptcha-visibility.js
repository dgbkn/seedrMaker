(()=>{"use strict";class e{static time(){return Date.now||(Date.now=()=>(new Date).getTime()),Date.now()}static sleep(e=1e3){return new Promise((t=>setTimeout(t,e)))}static async random_sleep(t,a){const i=Math.floor(Math.random()*(a-t)+t);return await e.sleep(i)}}class t{static async get({key:e,tab_specific:t}){return new Promise(((a,i)=>{chrome.runtime.sendMessage({type:"KV_GET",label:{key:e,tab_specific:t}},(e=>{e?a(e):i()}))}))}static async set({key:e,value:t,tab_specific:a}){return new Promise(((i,c)=>{chrome.runtime.sendMessage({type:"KV_SET",label:{key:e,value:t,tab_specific:a}},(e=>{e?i(e):c()}))}))}}(async()=>{async function a(){const e=document.querySelectorAll('iframe[src*="/recaptcha/api2/bframe"], iframe[src*="/recaptcha/enterprise/bframe"]');for(const a of e)if("visible"===window.getComputedStyle(a).visibility)return await t.set({key:"recaptcha_image_visible",value:!0,tab_specific:!0});if(e.length>0)return await t.set({key:"recaptcha_image_visible",value:!1,tab_specific:!0})}async function i(){const e=document.querySelectorAll('iframe[src*="/recaptcha/api2/anchor"], iframe[src*="/recaptcha/enterprise/anchor"]');for(const a of e)if("visible"===window.getComputedStyle(a).visibility)return await t.set({key:"recaptcha_widget_visible",value:!0,tab_specific:!0});if(e.length>0)return await t.set({key:"recaptcha_widget_visible",value:!1,tab_specific:!0})}for(;;)await e.sleep(1e3),chrome.runtime?.id&&(await a(),await i())})()})();