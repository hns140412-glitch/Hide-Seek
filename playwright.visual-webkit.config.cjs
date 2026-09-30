const {defineConfig}=require('@playwright/test');
// This is a Linux Playwright WebKit iPhone-sized integration gate.
// It is NOT a physical iPhone, real HEIC camera, or provider OCR validation.
module.exports=defineConfig({
  testDir:'./tests',timeout:30000,retries:0,
  // Visual/source UI gate must not race the independent SW-update lifecycle.
  // PWA safePoint() itself is asserted in browser tests.
  use:{baseURL:'http://127.0.0.1:4174',headless:true,serviceWorkers:'block'},
  webServer:{command:'python3 -m http.server 4174 --bind 127.0.0.1',port:4174,reuseExistingServer:true},
  projects:[{name:'webkit-mobile',use:{browserName:'webkit',viewport:{width:390,height:844},
    deviceScaleFactor:2,isMobile:true,hasTouch:true}}]
});
