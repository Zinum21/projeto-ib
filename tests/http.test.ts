import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin } from '../lib/http';
test('origem usa Host real preservando protocolo e porta',()=>{
 const req=(origin:string,host='127.0.0.1:3187')=>new Request('http://localhost:3187/api/auth',{headers:{origin,host}});
 assert.equal(sameOrigin(req('http://127.0.0.1:3187')),true);
 assert.equal(sameOrigin(req('https://evil.example')),false);
 assert.equal(sameOrigin(req('http://127.0.0.1:9999')),false);
 assert.equal(sameOrigin(req('https://127.0.0.1:3187')),false);
 assert.equal(sameOrigin(req('null')),false);
});
