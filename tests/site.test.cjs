'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname,'../docs/main.js'),'utf8');

async function runScenario(response) {
  const ids = [
    'header-release','install-release-link','release-history','footer-github',
    'primary-download','primary-download-text','release-download','release-mini',
    'release-version','release-size','release-date','release-status',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, {href: '', textContent: ''}]));
  let resolveRequest;
  const result = new Promise((resolve) => { resolveRequest=resolve; });
  const context = {
    document: {getElementById: (id) => elements[id] || null},
    fetch: async (url, opts) => {
      assert.equal(url,'https://api.github.com/repos/dev-rohit-gupta/auto-feedback/releases/latest');
      assert.equal(opts.headers.Accept,'application/vnd.github+json');
      return response;
    },
    AbortController: class {constructor(){this.signal={}} abort(){}},
    setTimeout: (cb, ms) => {assert.equal(ms,8000); return 1},
    clearTimeout: () => resolveRequest(),
    Intl, Date, Error, Number, String, Array,
  };
  vm.runInNewContext(js,context);
  await result;
  return elements;
}

test('before the first release, buttons safely link to releases instead of a missing file', async()=>{
  const e=await runScenario({status:404,ok:false});
  assert.match(e['release-version'].textContent,/coming soon/);
  assert.equal(e['primary-download'].href,'https://github.com/dev-rohit-gupta/auto-feedback/releases');
  assert.equal(e['release-download'].href,'https://github.com/dev-rohit-gupta/auto-feedback/releases');
});

test('latest stable release with named asset updates the direct download buttons',async()=>{
  const apkUrl='https://github.com/dev-rohit-gupta/auto-feedback/releases/download/v1.0.0/FeedbackGo.apk';
  const e=await runScenario({status:200,ok:true,json:async()=>({tag_name:'v1.0.0',published_at:'2026-10-13T12:00:00Z',assets:[
    {name:'wrong.apk',browser_download_url:'https://evil.example/file.apk',size:400},
    {name:'other.apk',browser_download_url:'https://github.com/dev-rohit-gupta/auto-feedback/releases/download/v1.0.0/other.apk',size:5000000},
    {name:'FeedbackGo.apk',browser_download_url:apkUrl,size:10485760},
  ]})});
  assert.equal(e['primary-download'].href,apkUrl);
  assert.equal(e['release-download'].href,apkUrl);
  assert.equal(e['primary-download-text'].textContent,'Download APK');
  assert.equal(e['release-size'].textContent,'10.0 MB APK');
  assert.equal(e['release-version'].textContent,'Version: v1.0.0');
});

test('release lacking an apk does not activate a fake download button',async()=>{
  const e=await runScenario({ok:true,json:async()=>({tag_name:'v1.0.1',assets:[{name:'notes.txt'}]})});
  assert.equal(e['primary-download'].href,'https://github.com/dev-rohit-gupta/auto-feedback/releases');
  assert.match(e['release-status'].textContent,/Visit the release page/);
});

test('rate limits or failed API requests preserve browsing release page',async()=>{
  const e=await runScenario({ok:false,status:403});
  assert.equal(e['release-download'].href,'https://github.com/dev-rohit-gupta/auto-feedback/releases');
  assert.match(e['release-status'].textContent,/Couldn't check/);
});


test('published website has correct static fallback links and cache-busted loader', () => {
  const html = fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
  assert.ok(html.includes('https://github.com/dev-rohit-gupta/auto-feedback/releases'));
  assert.ok(html.includes('main.js?v=repo-fix-1'));
  assert.equal(html.includes('/feedbackgo-download/'), false);
});
