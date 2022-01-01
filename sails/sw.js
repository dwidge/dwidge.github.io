const log = (...a) =>
	self.clients.matchAll().then(clients => {
		clients.forEach(client => client.postMessage(a))
	})

var scope = self.registration.scope
var version = '_VERSION_'
var cachePath = scope + version
var urls = ['', 'index.htm'].map(s => scope + s)

self.addEventListener('fetch', function(e) {
	/*
	if (urls.length)
		e.respondWith(
			caches.match(e.request).then(function(request) {
				log(request ? 'cache' : 'fetch', e.request.url)
				return fetch(e.request)
					.then(
						r => (
							caches.open(cachePath).then(cache => cache.add(e.request.url)), r
						)
					)
					.catch(err => caches.match(e.request))
			})
		)
	else
*/
	e.respondWith(
		fetch(e.request)
			.then(response =>
				caches
					.open(cachePath)
					.then(cache => cache.put(e.request, response.clone()))
					.then(r => (log('fresh', e.request.url), response))
			)

			.catch(err =>
				caches.match(e.request).then(req => (log('stale', e.request.url), req))
			)
	)
})

self.addEventListener('install', function(e) {
	e.waitUntil(
		Promise.all([
			self.skipWaiting(),
			caches.open(cachePath).then(function(cache) {
				log('install', cachePath)
				return cache.addAll(urls)
			})
		])
	)
})

self.addEventListener('activate', function(e) {
	log('activate')
	e.waitUntil(
		Promise.all([
			self.clients.claim(),
			caches.keys().then(function(keyList) {
				log('keys', keyList)
				return Promise.all(
					keyList.map(function(key, i) {
						if (key.indexOf(scope) == 0 && key !== cachePath) {
							log('delete', keyList[i])
							return caches.delete(keyList[i])
						}
					})
				)
			})
		])
	)
})
